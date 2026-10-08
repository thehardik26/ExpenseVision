import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Camera, X, UploadCloud, CheckCircle2, Sparkles, RefreshCw, FileText, ArrowRight, Check, AlertCircle, Copy, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = [
  'Food & Drinks',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Entertainment',
  'Housing',
  'Groceries',
  'Health & Wellness',
  'Other'
];

const formatDateToISO = (dateStr) => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const str = String(dateStr).trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Match DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // Fallback to JS Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};

export default function ReceiptScannerModal({ isOpen, onClose }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'scanning' | 'review' | 'success'
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [infoNotice, setInfoNotice] = useState('');
  const [autoSave, setAutoSave] = useState(false);
  const [isAiVerified, setIsAiVerified] = useState(false);

  // Form fields for extracted bill
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Shopping');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [tax, setTax] = useState('');
  const [savedTx, setSavedTx] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Clipboard paste listener (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e) => {
      if (step !== 'upload') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.startsWith('image/')) {
          const pastedFile = items[i].getAsFile();
          if (pastedFile) {
            e.preventDefault();
            processImageFile(pastedFile);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setPreviewUrl(null);
    setLoading(false);
    setSaving(false);
    setError('');
    setInfoNotice('');
    setIsAiVerified(false);
    setMerchant('');
    setAmount('');
    setCategory('Shopping');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setTax('');
    setSavedTx(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processImageFile = async (selectedFile, sampleName = null) => {
    setError('');
    setInfoNotice('');
    setLoading(true);
    setStep('scanning');

    let formData = new FormData();
    if (selectedFile) {
      formData.append('image', selectedFile);
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else if (sampleName) {
      // Create a virtual dummy file with sample name for intelligent simulation
      const blob = new Blob(["sample receipt image"], { type: "image/jpeg" });
      const virtualFile = new File([blob], `${sampleName.toLowerCase().replace(/\s+/g, '_')}_receipt.jpg`, { type: "image/jpeg" });
      formData.append('image', virtualFile);
      setFile(virtualFile);
    }

    if (autoSave) {
      formData.append('auto_save', 'true');
    }

    try {
      const res = await axios.post('/api/ai/scan-receipt/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = res.data;
      const parsedAmount = data.amount && Number(data.amount) > 0 ? String(data.amount) : '';
      const parsedMerchant = data.merchant && data.merchant !== 'N/A' ? data.merchant : '';
      
      setMerchant(parsedMerchant || (sampleName ? sampleName : 'Store / Vendor'));
      setAmount(parsedAmount);
      setCategory(CATEGORIES.includes(data.category) ? data.category : 'Shopping');
      setDate(formatDateToISO(data.date));
      setNotes(data.notes || '');
      setTax(data.tax && Number(data.tax) > 0 ? String(data.tax) : '');
      setIsAiVerified(Boolean(data.is_ai_extracted));

      if (data.is_ai_extracted && (!parsedAmount || !parsedMerchant)) {
        setInfoNotice('Gemini analyzed the image. Please verify or input the amount before saving.');
      }

      if (data.saved && data.transaction) {
        setSavedTx(data.transaction);
        setStep('success');
        window.dispatchEvent(new CustomEvent('transactionAdded', { detail: data.transaction }));
      } else {
        setStep('review');
      }
    } catch (err) {
      console.error('Scan receipt error:', err);
      setError('Could not reach Gemini vision OCR. You can review and enter details manually below.');
      setMerchant(sampleName || 'Store Vendor');
      setAmount('350.00');
      setCategory('Food & Drinks');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('Receipt entry');
      setIsAiVerified(false);
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processImageFile(selected);
    }
  };

  const handleSaveToTransactions = async (e) => {
    e.preventDefault();
    if (!amount || !merchant || saving) return;

    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('transaction_type', 'Expense');
      formData.append('category_name', category);
      formData.append('amount', parseFloat(amount));
      formData.append('date', formatDateToISO(date));
      formData.append('merchant', merchant);

      // Append Tax to notes so it is captured in transaction history
      let fullNotes = notes || '';
      if (tax && !fullNotes.includes('Tax') && !fullNotes.includes('GST')) {
        fullNotes = fullNotes ? `${fullNotes} (Tax/GST: ₹${tax})` : `Tax/GST: ₹${tax}`;
      }
      formData.append('notes', fullNotes);
      formData.append('ai_scanned', 'true');

      if (file && file instanceof File && file.size > 0) {
        formData.append('receipt_image', file);
      }

      const res = await axios.post('/api/transactions/', formData);
      setSavedTx(res.data);
      setStep('success');

      // Dispatch global event so Dashboard, Budgets, and Transactions update immediately
      window.dispatchEvent(new CustomEvent('transactionAdded', { detail: res.data }));
    } catch (err) {
      console.error('Failed to save scanned transaction:', err);
      let errorMsg = 'Could not record transaction to database.';
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'string') {
          errorMsg = d;
        } else if (d.detail) {
          errorMsg = d.detail;
        } else if (typeof d === 'object') {
          const fieldErrors = Object.entries(d)
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
            .join(' | ');
          if (fieldErrors) errorMsg = fieldErrors;
        }
      }
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
              <Camera size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                AI Receipt & Bill Scanner
                <span className="text-[10px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={10} className="text-violet-600" />
                  Gemini 3.5 Flash Vision
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Extracts total, date, vendor & updates your ledger</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 text-xs bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {infoNotice && (
            <div className="mb-4 text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-2.5 rounded-xl flex items-start gap-2">
              <Sparkles size={15} className="shrink-0 mt-0.5 text-amber-600" />
              <span>{infoNotice}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD SCREEN */}
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Primary Dropzone */}
              <label 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) processImageFile(droppedFile);
                }}
                className="border-2 border-dashed border-violet-200 hover:border-violet-500 bg-violet-50/40 hover:bg-violet-50/80 rounded-2xl p-7 flex flex-col items-center justify-center cursor-pointer transition group text-center"
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <div className="w-13 h-13 rounded-2xl bg-white border border-violet-100 shadow-sm flex items-center justify-center text-violet-600 group-hover:scale-105 transition-transform mb-3">
                  <UploadCloud size={26} />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  Upload Bill or Drag & Drop Here
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Supports PNG, JPG, JPEG, WEBP or Paste (<kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">Ctrl+V</kbd>)
                </div>
              </label>

              {/* Action Buttons: Camera Snap + Browse */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-11 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/40 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  <Camera size={16} className="text-violet-600" />
                  <span>Snap with Camera</span>
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/40 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  <ImageIcon size={16} className="text-slate-500" />
                  <span>Browse Photos</span>
                </button>
              </div>

              {/* Realistic Preset Samples */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-500" />
                  Or test with common Indian receipt templates:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => processImageFile(null, 'Starbucks Coffee')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 text-left transition text-xs cursor-pointer"
                  >
                    <div className="font-bold text-slate-800 truncate">☕ Starbucks</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">₹380.00 • Cafe</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => processImageFile(null, 'DMart Grocery Mart')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 text-left transition text-xs cursor-pointer"
                  >
                    <div className="font-bold text-slate-800 truncate">🛒 DMart Mart</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">₹1,420.00 • Groceries</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => processImageFile(null, 'PVR Cinemas')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 text-left transition text-xs cursor-pointer"
                  >
                    <div className="font-bold text-slate-800 truncate">🎬 PVR Cinemas</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">₹850.00 • Movie</div>
                  </button>
                </div>
              </div>

              {/* Auto-Save Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="text-xs text-slate-600 flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-slate-300 cursor-pointer"
                  />
                  <span>Auto-add directly to ledger upon scanning</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: SCANNING IN PROGRESS */}
          {step === 'scanning' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              {previewUrl ? (
                <div className="relative w-40 h-48 rounded-2xl overflow-hidden border border-violet-200 shadow-lg bg-slate-100">
                  <img
                    src={previewUrl}
                    alt="Scanning Preview"
                    className="w-full h-full object-cover filter brightness-95"
                  />
                  {/* Glowing Laser Scan Bar */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent shadow-[0_0_12px_#8b5cf6] animate-bounce" />
                </div>
              ) : (
                <div className="relative">
                  <div className="w-16 h-16 rounded-3xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-600 animate-pulse">
                    <Sparkles size={32} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center animate-spin">
                    <RefreshCw size={12} />
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  <Sparkles size={16} className="text-violet-600 animate-spin" />
                  Gemini Vision OCR Analyzing Bill...
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Extracting merchant name, total in ₹, transaction date, and GST tax details.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & EDIT EXTRACTED DATA CARD */}
          {step === 'review' && (
            <form onSubmit={handleSaveToTransactions} className="space-y-4">
              <div className="bg-violet-50/70 border border-violet-200/80 rounded-2xl p-3.5 flex items-center gap-3">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Receipt Thumbnail" 
                    className="w-12 h-12 object-cover rounded-xl border border-violet-200 shadow-2xs shrink-0" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-violet-200/80 text-violet-700 flex items-center justify-center shrink-0">
                    <FileText size={22} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-violet-900">Extracted from Bill</span>
                    {isAiVerified && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                        <Sparkles size={10} className="text-emerald-600" />
                        AI Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-violet-700/80 truncate">
                    Review and verify details before saving to your ledger.
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Merchant / Store Name
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    required
                    placeholder="e.g. Starbucks, Amazon"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Total Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Budget Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Bill Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  />
                </div>

                {tax ? (
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Tax / GST Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                    />
                  </div>
                ) : null}

                <div className={tax ? "col-span-2 sm:col-span-1" : "col-span-2"}>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Items / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. 2 lattes & blueberry muffin"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 h-11 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Rescan
                </button>
                <button
                  type="submit"
                  disabled={saving || !amount || !merchant}
                  className="flex-1 h-11 bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-violet-300 transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <span>Saving to ledger...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Add to Transactions & Budget</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs animate-in zoom-in-75">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Bill Added to Transactions!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Recorded expense of <strong className="text-slate-900 font-bold">₹{parseFloat(amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> for <strong className="text-slate-900 font-bold">{merchant}</strong> in <span className="text-violet-600 font-semibold">{category}</span>.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 text-xs text-slate-600 border border-slate-200/60 max-w-sm mx-auto text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-semibold text-slate-800">#{savedTx?.id || 'New'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-semibold text-slate-800">{date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ledger Impact:</span>
                  <span className="font-semibold text-rose-600">-₹{parseFloat(amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-semibold text-emerald-600">Updated in Budget Overview</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => resetState()}
                  className="flex-1 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  Scan Another Bill
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
