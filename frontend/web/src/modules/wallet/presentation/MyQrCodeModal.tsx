import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Copy,
  Check,
  Download,
  Link as LinkIcon,
  Lock,
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
  onOpenAuth?: () => void;
}

export const MyQrCodeModal: React.FC<MyQrCodeModalProps> = ({
  isOpen,
  onClose,
  user,
  walletId,
  onOpenAuth,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState<string>('');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [copiedType, setCopiedType] = useState<'email' | 'link' | null>(null);

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

    const qrLib: any = (QRCode as any).default || QRCode;

    qrLib
      .toString(payload, {
        type: 'svg',
        width: 320,
        margin: 2,
        color: {
          dark: '#022c22', // Deep emerald
          light: '#ffffff',
        },
      })
      .then((svg: string) => {
        setQrSvg(svg);
      })
      .catch((err: any) => {
        console.error('Failed to generate QR SVG:', err);
      });
  }, [isOpen, user, walletId, amount, note]);

  if (!isOpen) return null;

  if (!user) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
        <div className="py-8 text-center flex flex-col items-center space-y-4">
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-white">Authentication Required</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            Please log in or register an account to view and share your personal payment QR code.
          </p>
          <div className="flex items-center space-x-3 pt-2">
            <Button type="button" onClick={onClose} variant="ghost" size="md">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth?.();
              }}
              variant="primary"
              size="md"
            >
              Login to Nexpay
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user.email);
    setCopiedType('email');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/?transferTo=${encodeURIComponent(user.email)}${
      amount ? `&amount=${amount}` : ''
    }`;
    navigator.clipboard.writeText(link);
    setCopiedType('link');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexpay-qr-${user.email}.svg`;
    a.click();
    URL.revokeObjectURL(url);
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
          <div className="w-56 h-56 flex items-center justify-center overflow-hidden rounded-2xl bg-white">
            {qrSvg ? (
              <div
                className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <div className="text-xs text-slate-400 animate-pulse font-medium">
                Generating QR...
              </div>
            )}
          </div>

          <div className="mt-3 text-center">
            <h4 className="text-sm font-black text-slate-900">{user.fullName}</h4>
            <p className="text-xs text-slate-500 font-mono font-medium">{user.email}</p>
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

        {/* Action Buttons: 3 buttons (Copy Email, Copy Link, Download) */}
        <div className="grid grid-cols-3 gap-2 w-full pt-1">
          <Button
            type="button"
            onClick={handleCopyEmail}
            variant="secondary"
            size="sm"
            className="justify-center text-[11px] px-2"
            icon={copiedType === 'email' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          >
            {copiedType === 'email' ? 'Copied' : 'Email'}
          </Button>

          <Button
            type="button"
            onClick={handleCopyLink}
            variant="secondary"
            size="sm"
            className="justify-center text-[11px] px-2"
            icon={copiedType === 'link' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <LinkIcon className="h-3.5 w-3.5" />}
          >
            {copiedType === 'link' ? 'Copied' : 'Link'}
          </Button>

          <Button
            type="button"
            onClick={handleDownloadQr}
            variant="secondary"
            size="sm"
            className="justify-center text-[11px] px-2"
            icon={<Download className="h-3.5 w-3.5" />}
          >
            Save QR
          </Button>
        </div>
      </div>
    </Modal>
  );
};
