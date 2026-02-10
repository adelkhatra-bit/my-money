import React from 'react';
import styles from './FatalErrorScreen.module.css';

export default function FatalErrorScreen({ error, errorInfo }) {
  const copyErrorToClipboard = () => {
    const errorText = `
ERROR: ${error?.message || 'Unknown error'}
STACK: ${error?.stack || 'No stack trace'}
COMPONENT STACK: ${errorInfo?.componentStack || 'No component stack'}
TIMESTAMP: ${new Date().toISOString()}
URL: ${window.location.href}
USER AGENT: ${navigator.userAgent}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      alert('Error copied to clipboard!');
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.errorBox}>
        <div className={styles.header}>
          <span className={styles.icon}>⚠️</span>
          <h1 className={styles.title}>Application Error</h1>
        </div>

        <div className={styles.content}>
          <p className={styles.message}>
            Something went wrong. The application encountered an unexpected error.
          </p>

          <div className={styles.errorDetails}>
            <h2 className={styles.subtitle}>Error Details:</h2>
            <pre className={styles.errorMessage}>
              {error?.message || 'Unknown error'}
            </pre>

            <h3 className={styles.subtitle}>Stack Trace:</h3>
            <pre className={styles.stackTrace}>
              {error?.stack || 'No stack trace available'}
            </pre>

            {errorInfo?.componentStack && (
              <>
                <h3 className={styles.subtitle}>Component Stack:</h3>
                <pre className={styles.stackTrace}>
                  {errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>

          <div className={styles.actions}>
            <button
              onClick={() => window.location.reload()}
              className={styles.reloadButton}
            >
              Reload Page
            </button>
            <button
              onClick={copyErrorToClipboard}
              className={styles.copyButton}
            >
              Copy Error
            </button>
          </div>

          <div className={styles.info}>
            <p><strong>Time:</strong> {new Date().toISOString()}</p>
            <p><strong>URL:</strong> {window.location.href}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
