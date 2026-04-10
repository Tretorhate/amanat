import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api/axios";

export const UserBulkImport = ({ onImportComplete }: { onImportComplete?: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error("Файл должен быть в формате CSV");
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Размер файла превышает 5 МБ");
      return;
    }
    
    // Validate file is not empty
    if (file.size === 0) {
      toast.error("Файл не может быть пустым");
      return;
    }
    
    // Set selected file name
    setSelectedFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    // Debug logging
    console.log("FormData contents:");
    formData.forEach((value, key) => {
      console.log(key, value);
    });
    console.log("File object:", file);
    console.log("File name:", file.name);
    console.log("File size:", file.size);

    try {
      setUploading(true);
      const response = await api.post("/accounts/admin/users/import-csv/", formData, {
        headers: {
          "Content-Type": undefined,
        },
      });

      // Show summary
      toast.success(`${response.data.created_count} пользователей успешно создано`);
      
      if (response.data.skipped_count > 0) {
        toast.info(`${response.data.skipped_count} строк пропущено`);
      }
      
      if (response.data.error_count > 0) {
        toast.error(`${response.data.error_count} ошибок при обработке`);
        
        // Show detailed errors
        if (response.data.errors && response.data.errors.length > 0) {
          const errorMessages = response.data.errors.slice(0, 5).join('\n');
          toast.error(
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium mb-1">Детали ошибок:</div>
                <pre className="text-xs whitespace-pre-wrap">{errorMessages}</pre>
                {response.data.errors.length > 5 && (
                  <div className="text-xs mt-1">... и ещё {response.data.errors.length - 5} ошибок</div>
                )}
              </div>
            </div>
          );
        }
      }
      
      // Call callback to refresh users list after successful import
      if (response.data.created_count > 0 && onImportComplete) {
        onImportComplete();
      }
    } catch (error: unknown) {
      console.error("Error importing users:", error);
      const err = error as { response?: { data?: { error?: string } }; request?: unknown; config?: unknown };
      console.error("Error response:", err.response);
      console.error("Error request:", err.request);
      console.error("Error config:", err.config);

      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Ошибка при импорте пользователей");
      }
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Clear selected file name
      setSelectedFileName(null);
    }
  };

  const handleDownloadSample = async () => {
    try {
      setDownloadLoading(true);
      // Download sample CSV from backend API
      const response = await api.get('/accounts/admin/sample-csv/', {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample_users.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading sample file:", error);
      toast.error("Ошибка при загрузке образца файла");
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Массовый импорт пользователей</h3>
          <p className="text-gray-600 text-sm mt-1">
            Загрузите CSV файл для массового создания пользователей
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={handleDownloadSample}
            disabled={downloadLoading}
            className="w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloadLoading ? "Загрузка..." : "Образец CSV"}
          </Button>
          
          <div className="w-full sm:w-auto">
            <Button
              type="button"
              disabled={uploading}
              onClick={handleUploadClick}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Загрузка...
                </>
              ) : (
                "Загрузить CSV"
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            {selectedFileName && (
              <div className="mt-2 text-sm text-gray-600">
                Выбран файл: <span className="font-medium">{selectedFileName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p className="flex items-start gap-2">
          <FileSpreadsheet className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Формат CSV:</strong> phone_number,full_name,role,constituency
          </span>
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>role: citizen или deputy</li>
          <li>constituency: название округа</li>
          <li>Пример: +998901234567,Иванов Иван,citizen,Чиланзарский район</li>
        </ul>
      </div>
    </Card>
  );
};