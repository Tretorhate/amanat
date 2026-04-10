export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <title>404 - Page Not Found</title>
        <style>
          {`
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            html, body {
              width: 100%;
              height: 100%;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            }

            body {
              background: linear-gradient(135deg, #f1f5f9 0%, #ffffff 50%, #f0f4ff 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1rem;
            }

            .container {
              max-width: 28rem;
              width: 100%;
              text-align: center;
            }

            .icon-wrapper {
              margin-bottom: 2rem;
              display: flex;
              justify-content: center;
            }

            .icon-box {
              width: 6rem;
              height: 6rem;
              background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
              border-radius: 1.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
              font-size: 3rem;
            }

            h1 {
              font-size: 3.75rem;
              font-weight: 700;
              color: #111827;
              margin-bottom: 1rem;
            }

            h2 {
              font-size: 1.5rem;
              font-weight: 700;
              color: #111827;
              margin-bottom: 1rem;
            }

            p {
              color: #4b5563;
              font-size: 1.125rem;
              margin-bottom: 2rem;
              line-height: 1.6;
            }

            .button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 0.75rem;
              padding: 0.875rem 2rem;
              border-radius: 0.75rem;
              font-weight: 600;
              text-decoration: none;
              transition: all 0.3s ease;
              border: none;
              cursor: pointer;
              font-size: 1rem;
              background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
              color: white;
            }

            .button:hover {
              box-shadow: 0 20px 25px rgba(37, 99, 235, 0.3);
              transform: translateY(-2px);
            }

            .arrow {
              font-size: 1.25rem;
            }
          `}
        </style>
      </head>
      <body>
        <div className="container">
          {/* Error Code and Message */}
          <h1>404</h1>
          <h2>Page Not Found</h2>
          <p>
            The page you are looking for does not exist or has been removed.
          </p>

          {/* Back Button */}
          <a href="/" className="button">
            <span className="arrow">←</span>
          </a>
        </div>
      </body>
    </html>
  );
}
