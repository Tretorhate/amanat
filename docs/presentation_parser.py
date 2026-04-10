import json
import os
import datetime
from pathlib import Path

def create_combined_presentation(json_data):
    """
    Extract all HTML slides from the JSON data and combine them into one HTML file
    """
    try:
        # Parse the JSON data
        if isinstance(json_data, str):
            data = json.loads(json_data)
        else:
            data = json_data
        
        # Get metadata
        meta_data = data["data"]["meta_data"]
        file_name = meta_data["file_name"]
        file_prefix = meta_data["file_prefix"]
        page_num = meta_data["page_num"]
        
        # Get all slides
        slides = data["data"]["file_contents"]
        
        # Create output directory if it doesn't exist
        output_dir = Path("combined_presentation")
        output_dir.mkdir(exist_ok=True)
        
        # Save individual slides
        individual_slides_dir = output_dir / "individual_slides"
        individual_slides_dir.mkdir(exist_ok=True)
        
        print(f"Processing presentation: {file_name}")
        print(f"Total slides: {len(slides)}")
        
        # Create combined HTML
        combined_html = []
        
        # Add HTML header
        combined_html.append(f"""<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>{file_name}</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&amp;family=Inter:wght@300;400;500&amp;display=swap" rel="stylesheet"/>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"/>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Inter', sans-serif;
            background-color: #F8FAFC;
            padding: 20px;
        }}
        
        .presentation-container {{
            max-width: 1300px;
            margin: 0 auto;
        }}
        
        .header {{
            background-color: #005A9C;
            color: white;
            padding: 20px 30px;
            border-radius: 10px 10px 0 0;
            margin-bottom: 20px;
        }}
        
        .presentation-title {{
            font-family: 'Montserrat', sans-serif;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
        }}
        
        .presentation-meta {{
            display: flex;
            gap: 20px;
            font-size: 14px;
            opacity: 0.9;
        }}
        
        .slide-counter {{
            background-color: #00B1B0;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: 600;
            display: inline-block;
            margin-top: 10px;
        }}
        
        .slides-container {{
            display: flex;
            flex-direction: column;
            gap: 30px;
            margin-bottom: 40px;
        }}
        
        .slide-wrapper {{
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #E2E8F0;
            transition: transform 0.2s ease;
        }}
        
        .slide-wrapper:hover {{
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }}
        
        .slide-header {{
            background-color: #F8FAFC;
            padding: 15px 20px;
            border-bottom: 1px solid #E2E8F0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        
        .slide-number {{
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            color: #005A9C;
            background-color: #EFF6FF;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 14px;
        }}
        
        .slide-title {{
            font-weight: 600;
            color: #334155;
            font-size: 16px;
        }}
        
        .slide-content {{
            padding: 0;
            width: 100%;
            overflow: hidden;
        }}
        
        .slide-iframe {{
            width: 100%;
            height: 450px;
            border: none;
            display: block;
        }}
        
        .slide-template-info {{
            background-color: #F0FDFA;
            padding: 10px 15px;
            border-top: 1px solid #E2E8F0;
            font-size: 12px;
            color: #475569;
        }}
        
        .template-name {{
            color: #00B1B0;
            font-weight: 600;
        }}
        
        .navigation {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E2E8F0;
        }}
        
        .btn {{
            background-color: #005A9C;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
        }}
        
        .btn:hover {{
            background-color: #004A85;
        }}
        
        .footer {{
            text-align: center;
            padding: 20px;
            color: #64748B;
            font-size: 14px;
            margin-top: 40px;
            border-top: 1px solid #E2E8F0;
        }}
        
        .stats {{
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-top: 10px;
            font-size: 12px;
        }}
        
        .stat-item {{
            background-color: #F1F5F9;
            padding: 5px 10px;
            border-radius: 4px;
        }}
    </style>
</head>
<body>
    <div class="presentation-container">
        <div class="header">
            <h1 class="presentation-title">{file_name}</h1>
            <div class="presentation-meta">
                <span>Slides: {page_num}</span>
                <span>Project ID: {meta_data["project_id"]}</span>
                <span>Aspect Ratio: {meta_data["aspect_ratio"]}</span>
            </div>
            <div class="slide-counter">Combined Presentation</div>
        </div>
        
        <div class="slides-container">""")
        
        # Process each slide
        slide_data_list = []
        for i, slide in enumerate(slides):
            slide_id = slide.get("page_id", f"slide_{i+1}")
            content = slide["content"]
            temp_name = slide.get("temp_name", f"Slide {i+1}")
            temp_description = slide.get("template_description", "")
            cdn_url = slide.get("cdn_url", "")
            blob_url = slide.get("blob_url", "")
            
            # Save individual slide
            slide_filename = f"{file_prefix}_slide_{i+1:02d}.html"
            slide_path = individual_slides_dir / slide_filename
            
            with open(slide_path, "w", encoding="utf-8") as f:
                f.write(content)
            
            print(f"  Saved slide {i+1}: {slide_filename}")
            
            # Store slide data for combined presentation
            slide_data_list.append({
                "index": i + 1,
                "id": slide_id,
                "content": content,
                "filename": slide_filename,
                "temp_name": temp_name,
                "temp_description": temp_description,
                "cdn_url": cdn_url,
                "blob_url": blob_url
            })
        
        # Add slides to combined HTML
        for slide_data in slide_data_list:
            slide_num = slide_data["index"]
            
            # Extract title and body content from slide
            slide_html = slide_data["content"]
            
            # Extract title
            title_start = slide_html.find("<title>")
            title_end = slide_html.find("</title>")
            slide_title = slide_html[title_start+7:title_end] if title_start != -1 and title_end != -1 else f"Slide {slide_num}"
            
            # Extract body content (remove html, head, and body tags)
            body_start = slide_html.find("<body>")
            body_end = slide_html.find("</body>")
            
            if body_start != -1 and body_end != -1:
                # Extract content between <body> and </body> tags
                body_content = slide_html[body_start+6:body_end].strip()
            else:
                # If no body tags found, use the whole content
                body_content = slide_html
            
            combined_html.append(f"""
            <div class="slide-wrapper" id="slide-{slide_num}">
                <div class="slide-header">
                    <div class="slide-title">{slide_title}</div>
                    <div class="slide-number">Slide {slide_num}</div>
                </div>
                <div class="slide-content">
                    {body_content}
                </div>
                <div class="slide-template-info">
                    <span class="template-name">Template:</span> {slide_data['temp_name']}
                </div>
            </div>""")
        
        # Add closing HTML
        combined_html.append(f"""
        </div>
        
        <div class="navigation">
            <a href="#slide-1" class="btn">Back to Top</a>
            <div class="stats">
                <div class="stat-item">Total slides: {len(slides)}</div>
                <div class="stat-item">Status: {"Completed" if meta_data.get("is_finished", True) else "In Progress"}</div>
                <div class="stat-item">Project: {meta_data["project_id"][:8]}...</div>
            </div>
        </div>
        
        <div class="footer">
            <p>Combined presentation generated from {file_name}</p>
            <p>Generated on {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
    </div>
    
    <script>
        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {{
            anchor.addEventListener('click', function (e) {{
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if(targetId !== '#') {{
                    const targetElement = document.querySelector(targetId);
                    if(targetElement) {{
                        window.scrollTo({{
                            top: targetElement.offsetTop - 20,
                            behavior: 'smooth'
                        }});
                    }}
                }}
            }});
        }});
        
        // Add slide highlighting on scroll
        const slideWrappers = document.querySelectorAll('.slide-wrapper');
        const observerOptions = {{
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        }};
        
        const observer = new IntersectionObserver((entries) => {{
            entries.forEach(entry => {{
                if(entry.isIntersecting) {{
                    entry.target.style.borderLeft = '4px solid #00B1B0';
                }} else {{
                    entry.target.style.borderLeft = 'none';
                }}
            }});
        }}, observerOptions);
        
        slideWrappers.forEach(slide => observer.observe(slide));
    </script>
</body>
</html>""")
        
        # Save combined HTML
        combined_filename = f"{file_prefix}_combined.html"
        combined_path = output_dir / combined_filename
        
        with open(combined_path, "w", encoding="utf-8") as f:
            f.write("\n".join(combined_html))
        
        print(f"\n✅ Successfully created combined presentation!")
        print(f"   Individual slides saved in: {individual_slides_dir}/")
        print(f"   Combined HTML saved as: {combined_path}")
        
        # Also create a simple index file
        index_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Presentation Files - {file_name}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
        .container {{ max-width: 800px; margin: 0 auto; }}
        h1 {{ color: #005A9C; }}
        .file-list {{ list-style: none; padding: 0; }}
        .file-list li {{ padding: 10px; border-bottom: 1px solid #eee; }}
        .file-list a {{ color: #00B1B0; text-decoration: none; }}
        .file-list a:hover {{ text-decoration: underline; }}
        .info-box {{ background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>{file_name}</h1>
        <div class="info-box">
            <p><strong>Project ID:</strong> {meta_data['project_id']}</p>
            <p><strong>Total Slides:</strong> {len(slides)}</p>
            <p><strong>Description:</strong> {meta_data.get('description', 'No description')[:200]}...</p>
        </div>
        
        <h2>Available Files:</h2>
        <ul class="file-list">
            <li><a href="{combined_filename}">📄 <strong>Complete Presentation</strong> (all slides combined)</a></li>
            <li><hr></li>
            {"".join([f'<li><a href="individual_slides/{slide["filename"]}">📊 Slide {slide["index"]}: {slide["temp_name"]}</a></li>' for slide in slide_data_list])}
        </ul>
    </div>
</body>
</html>"""
        
        index_path = output_dir / "index.html"
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(index_content)
        
        print(f"   Index file created: {index_path}")
        
        return {
            "combined_file": str(combined_path),
            "individual_slides_dir": str(individual_slides_dir),
            "index_file": str(index_path),
            "total_slides": len(slides),
            "metadata": meta_data
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def main():
    # Load your JSON data
    # Replace this with your actual JSON data loading method
    
    # If your data is in a file:
    with open('presentation.json', 'r', encoding='utf-8') as f:
         json_data = json.load(f)
    
    # For testing with the provided data (you would paste your JSON here):
    # json_data = {... your JSON data ...}
    
    # Example usage:
    print("Please provide the JSON data...")
    
    # Since the JSON data is large, you might want to load it from a file
    result = create_combined_presentation(json_data)
    
    # For now, we'll create a placeholder
    print("Script ready to process presentation data.")
    print("\nUsage:")
    print("1. Save your JSON data to a file (e.g., 'presentation.json')")
    print("2. Modify the script to load from that file")
    print("3. Run the script")
    print("\nThe script will create:")
    print("  - A 'combined_presentation' folder")
    print("  - Individual slide HTML files")
    print("  - A combined HTML file with all slides")
    print("  - An index.html for easy navigation")


if __name__ == "__main__":
    main()
