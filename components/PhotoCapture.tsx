/* eslint-disable @next/next/no-img-element -- Photos are private, compressed data URLs, not remote optimized assets. */
"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, RotateCcw, X } from "lucide-react";
export function PhotoCapture({ value, onChange, label = "Evidencia fotográfica" }: { value: string; onChange: (photo: string) => void; label?: string }) {
  const video = useRef<HTMLVideoElement>(null), stream = useRef<MediaStream | null>(null), active = useRef(true), request = useRef({ generation: 0 });
  const [camera, setCamera] = useState(false), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const stop = () => { request.current.generation++; stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; setCamera(false); setBusy(false); };
  useEffect(() => { active.current = true; const lifecycle = request.current; return () => { active.current = false; lifecycle.generation++; stream.current?.getTracks().forEach(t => t.stop()); }; }, []);
  useEffect(() => { if (camera && video.current && stream.current) { video.current.srcObject = stream.current; video.current.play().catch(() => setError("No se pudo mostrar la cámara. Adjunta una foto.")); } }, [camera]);
  const start = async () => {
    setError(""); setBusy(true); const id = ++request.current.generation;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("La cámara requiere HTTPS o localhost. Puedes adjuntar una foto desde tu dispositivo.");
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
      if (!active.current || id !== request.current.generation) { media.getTracks().forEach(t => t.stop()); return; }
      stream.current = media; setCamera(true);
    } catch (e) { if (active.current) setError(e instanceof Error && e.message.includes("HTTPS") ? e.message : "No pudimos abrir la cámara. Revisa el permiso del navegador o adjunta una foto."); }
    finally { if (active.current) setBusy(false); }
  };
  const encode = (source: CanvasImageSource, width: number, height: number) => {
    const ratio = Math.min(1, 900 / Math.max(width, height)), canvas = document.createElement("canvas");
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
    let quality = .78, photo = canvas.toDataURL("image/jpeg", quality);
    while (photo.length > 480000 && quality > .2) { quality -= .1; photo = canvas.toDataURL("image/jpeg", quality); }
    if (photo.length > 500000) throw new Error("La foto es demasiado grande. Elige otra imagen.");
    onChange(photo); stop();
  };
  const file = async (file?: File) => {
    if (!file) return; setError("");
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10000000) { setError("Elige una imagen JPG, PNG o WebP de hasta 10 MB."); return; }
    const url = URL.createObjectURL(file);
    try { const image = new Image(); image.src = url; await image.decode(); if (active.current) encode(image, image.naturalWidth, image.naturalHeight); }
    catch { setError("No pudimos leer la foto. Prueba con una imagen JPG o PNG."); }
    finally { URL.revokeObjectURL(url); }
  };
  return <div className="photo-field"><span className="field-label">{label}</span>{camera ? <div className="camera-preview"><video ref={video} muted playsInline autoPlay aria-label="Vista previa de la cámara" /><div className="photo-actions"><button type="button" className="primary-button" onClick={() => { const v = video.current; if (!v?.videoWidth) return setError("Espera a que aparezca la imagen de la cámara."); try { encode(v, v.videoWidth, v.videoHeight); } catch (e) { setError((e as Error).message); } }}><Camera size={18} /> Capturar foto</button><button type="button" className="secondary-button" onClick={stop}>Cerrar cámara</button></div></div> : value ? <div className="photo-preview"><img src={value} alt={label} /><button type="button" className="secondary-button" onClick={() => onChange("")}><RotateCcw size={16} /> Cambiar foto</button></div> : <div className="photo-empty"><Camera size={28} /><strong>Una foto para respaldar el registro</strong><p>Revisa que la imagen sea clara antes de guardar.</p><div className="photo-actions"><button type="button" className="primary-button" disabled={busy} onClick={start}><Camera size={17} />{busy ? "Abriendo cámara…" : "Tomar foto"}</button><label className="secondary-button upload-button"><ImagePlus size={17} /> Adjuntar foto<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { void file(e.target.files?.[0]); e.target.value = ""; }} /></label></div>{busy && <button type="button" className="text-button" onClick={stop}><X size={14} /> Cancelar</button>}</div>}{error && <p role="alert" className="inline-error">{error}</p>}</div>;
}
