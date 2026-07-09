import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import Modal from './Modal';
import { Copy, Check } from 'lucide-react';

const QRCodeModal = ({ isOpen, onClose, batchCode, batchName }) => {
  const canvasRef = useRef(null);
  const [copied, setCopied] = React.useState(false);
  
  const inviteUrl = `${window.location.origin}/register?code=${batchCode}`;

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        inviteUrl,
        {
          width: 200,
          margin: 2,
          color: {
            dark: '#14213D',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [isOpen, inviteUrl]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Batch Share - ${batchName}`}>
      <div className="flex flex-col items-center text-center space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Share this QR Code or link with students to allow them to self-enroll in this batch.
        </p>

        {/* QR Code Canvas */}
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
          <canvas ref={canvasRef}></canvas>
        </div>

        {/* Invite Link input */}
        <div className="w-full flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-2">
          <input
            type="text"
            readOnly
            value={inviteUrl}
            className="flex-1 bg-transparent text-xs text-gray-700 dark:text-gray-300 border-none outline-none overflow-x-auto"
          />
          <button
            onClick={copyToClipboard}
            className="ml-2 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex justify-end w-full pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:opacity-90 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default QRCodeModal;
