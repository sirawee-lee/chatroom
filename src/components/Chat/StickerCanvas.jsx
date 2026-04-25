import React, { useRef, useState, useEffect, useCallback } from 'react';

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

const BRUSHES = [
  { name: 'Pencil', size: 2, style: 'round', opacity: 1 },
  { name: 'Pen',    size: 5, style: 'round', opacity: 1 },
  { name: 'Marker', size: 14, style: 'square', opacity: 0.85 },
];

const CANVAS_W = 340;
const CANVAS_H = 240;

export default function StickerCanvas({ onSend, onClose }) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [brushIdx, setBrushIdx] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const lastPoint = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    saveSnapshot();
  }, []);

  const saveSnapshot = () => {
    const canvas = canvasRef.current;
    setHistory(prev => [...prev.slice(-19), canvas.toDataURL()]);
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setDrawing(true);
    const pos = getPos(e);
    lastPoint.current = pos;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const brush = BRUSHES[brushIdx];
    ctx.globalAlpha = brush.opacity;
    ctx.lineJoin = 'round';
    ctx.lineCap = brush.style === 'round' ? 'round' : 'square';
    ctx.strokeStyle = color;
    ctx.lineWidth = brush.size;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brush.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const draw = useCallback((e) => {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const brush = BRUSHES[brushIdx];
    ctx.globalAlpha = brush.opacity;
    ctx.lineJoin = 'round';
    ctx.lineCap = brush.style === 'round' ? 'round' : 'square';
    ctx.strokeStyle = color;
    ctx.lineWidth = brush.size;
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPoint.current = pos;
  }, [drawing, color, brushIdx]);

  const stopDrawing = () => {
    if (drawing) {
      setDrawing(false);
      saveSnapshot();
    }
  };

  const handleUndo = () => {
    if (history.length < 2) return;
    const prev = history[history.length - 2];
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, CANVAS_W, CANVAS_H); ctx.drawImage(img, 0, 0); };
    img.src = prev;
    setHistory(h => h.slice(0, -1));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    saveSnapshot();
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (blob) onSend(blob);
    }, 'image/png');
  };

  return (
    <div className="sticker-canvas-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sticker-canvas-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>✏️ Draw a Sticker</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ width: CANVAS_W, height: CANVAS_H, borderRadius: 8, border: '1px solid var(--border)' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        <div className="canvas-tools">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 4 }}>Color:</span>
          {COLORS.map(c => (
            <button
              key={c}
              className={`color-btn${color === c ? ' active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              title={c}
            />
          ))}
        </div>

        <div className="canvas-tools">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 4 }}>Brush:</span>
          {BRUSHES.map((b, i) => (
            <button
              key={b.name}
              className={`brush-btn${brushIdx === i ? ' active' : ''}`}
              onClick={() => setBrushIdx(i)}
            >
              {b.name}
            </button>
          ))}
        </div>

        <div className="canvas-actions">
          <button className="btn-secondary" onClick={handleUndo} disabled={history.length < 2}>Undo</button>
          <button className="btn-secondary" onClick={handleClear}>Clear</button>
          <button className="btn-save" onClick={handleSend}>Send Sticker</button>
        </div>
      </div>
    </div>
  );
}
