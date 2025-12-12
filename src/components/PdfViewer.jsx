import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

const PdfViewer = ({ pdfUrl, pdfName, onClose }) => {
  const [scale, setScale] = useState(1.0);

  if (!pdfUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = pdfName || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] m-4 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{pdfName || 'Document PDF'}</h3>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-700 rounded transition"
              title="Zoom arrière"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm font-mono min-w-[4rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-700 rounded transition"
              title="Zoom avant"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-600 mx-2" />
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-700 rounded transition"
              title="Télécharger"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded transition"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="flex justify-center">
            <iframe
              src={`${pdfUrl}#view=FitH`}
              className="bg-white shadow-lg"
              style={{
                width: `${100 * scale}%`,
                minHeight: '800px',
                height: 'calc(100vh - 200px)',
                border: 'none'
              }}
              title={pdfName || 'PDF Viewer'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
