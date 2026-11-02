import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { Button } from '../../../shared/Button';
import { CurrencyFormatter } from '../../../core/utils/formatters';
import type { User } from '../../auth/domain/User';

interface MyQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  walletId?: string;
}

export const MyQrCodeModal: React.FC<MyQrCodeModalProps> = ({
  isOpen,
  onClose,
  user,
  walletId,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    const payload = JSON.stringify({
      scheme: 'nexpay',
      type: 'p2p_transfer',
      receiverId: user.id,
      receiverName: user.fullName,
      receiverEmail: user.email,
      walletId: walletId || '',
      amount: amount || undefined,
      note: note || undefined,
    });

    QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#022c22', // Deep emerald
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [isOpen, user, walletId, amount, note]);

  if (!isOpen || !user) return null;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(user.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `nexpay-qr-${user.email}.png`;
    a.click();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-800 mb-4">
        <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <QrCode className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Receive Money via QR</h3>
          <p className="text-xs text-slate-400">VietQR & Nexpay Standard Code</p>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-4">
        {/* QR Frame Card */}
        <div className="p-4 rounded-3xl bg-white shadow-2xl flex flex-col items-center border border-slate-200">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Nexpay Payment QR"
              className="w-56 h-56 rounded-2xl"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
              Generating QR...
            </div>
          )}

          <div className="mt-3 text-center">
            <h4 className="text-sm font-black text-slate-900">{user.fullName}</h4>
            <p className="text-xs text-slate-500 font-medium">{user.email}</p>
            {amount ? (
              <p className="text-sm font-mono font-black text-emerald-600 mt-1">
                Requesting: {CurrencyFormatter.formatVND(Number(amount))}
              </p>
            ) : (
              <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Any Amount
              </span>
            )}
          </div>
        </div>

        {/* Optional Amount & Note Configuration */}
        <div className="w-full space-y-2.5 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Specify Amount (Optional)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                placeholder="Leave blank for any amount"
              />
              <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">VND</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Transfer Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Lunch money"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
          <Button
            type="button"
            onClick={handleCopyPayload}
            variant="secondary"
            size="md"
            className="justify-center text-xs"
            icon={copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          >
            {copied ? 'Copied Email' : 'Copy Email'}
          </Button>

          <Button
            type="button"
            onClick={handleDownloadQr}
            variant="secondary"
            size="md"
            className="justify-center text-xs"
            icon={<Download className="h-4 w-4" />}
          >
            Download QR
          </Button>
        </div>
      </div>
    </Modal>
  );
};
