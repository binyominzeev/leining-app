import { useEffect, useRef, useState } from 'react'
import type { VideoMatch } from '../utils/taamSequences'
import styles from './TaamVideoPanel.module.css'

type Props = {
  match: VideoMatch | null
  nextUrl: string | null
  msPerWord: number
  isPlaying: boolean
}

type Geometry = { x: number; y: number; w: number; h: number }

const MIN_RATE = 0.5
const MAX_RATE = 2
const GEOMETRY_KEY = 'leining-taam-video-geometry'
const MIN_W = 160
const MIN_H = 140

function clamp(g: Geometry): Geometry {
  const w = Math.min(Math.max(g.w, MIN_W), window.innerWidth)
  const h = Math.min(Math.max(g.h, MIN_H), window.innerHeight)
  return {
    w,
    h,
    x: Math.min(Math.max(g.x, 0), window.innerWidth - w),
    y: Math.min(Math.max(g.y, 0), window.innerHeight - h),
  }
}

function loadGeometry(): Geometry {
  try {
    const raw = localStorage.getItem(GEOMETRY_KEY)
    if (raw) {
      const g = JSON.parse(raw) as Geometry
      if ([g.x, g.y, g.w, g.h].every((n) => typeof n === 'number' && isFinite(n))) return clamp(g)
    }
  } catch { /* fall through to default */ }
  return clamp({ x: 16, y: window.innerHeight - 340, w: 240, h: 220 })
}

export default function TaamVideoPanel({ match, nextUrl, msPerWord, isPlaying }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [geo, setGeo] = useState<Geometry>(loadGeometry)
  const geoRef = useRef(geo)
  geoRef.current = geo

  // Keep showing the last clip while no sequence matches
  const shownRef = useRef<VideoMatch | null>(null)
  if (match) shownRef.current = match
  const shown = shownRef.current
  const startIndex = shown?.wordIndices[0]

  const fitRate = () => {
    const v = videoRef.current
    if (!v || !shown || !v.duration || !isFinite(v.duration)) return
    const target = (shown.length * msPerWord) / 1000
    v.playbackRate = Math.min(MAX_RATE, Math.max(MIN_RATE, v.duration / target))
  }

  // Restart whenever a new sequence instance begins
  useEffect(() => {
    const v = videoRef.current
    if (!v || !shown) return
    v.currentTime = 0
    fitRate()
    if (isPlaying) v.play().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startIndex, shown?.url])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (isPlaying) v.play().catch(() => {})
    else v.pause()
  }, [isPlaying])

  useEffect(fitRate)

  useEffect(() => {
    const onResize = () => setGeo((g) => clamp(g))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const onResizeStart = (e: React.PointerEvent<HTMLDivElement>, west: boolean, north: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const o = geoRef.current
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      const w = Math.max(MIN_W, o.w + (west ? -dx : dx))
      const h = Math.max(MIN_H, o.h + (north ? -dy : dy))
      // Anchor the opposite edge when dragging a west/north corner
      setGeo(clamp({ w, h, x: west ? o.x + o.w - w : o.x, y: north ? o.y + o.h - h : o.y }))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      localStorage.setItem(GEOMETRY_KEY, JSON.stringify(geoRef.current))
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const origin = geoRef.current
    const move = (ev: PointerEvent) => {
      setGeo(clamp({ ...origin, x: origin.x + ev.clientX - startX, y: origin.y + ev.clientY - startY }))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      localStorage.setItem(GEOMETRY_KEY, JSON.stringify(geoRef.current))
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      ref={panelRef}
      className={styles.panel}
      style={{ left: geo.x, top: geo.y, width: geo.w, height: geo.h }}
    >
      <div className={styles.label} onPointerDown={onDragStart} title="גרור להזזה">
        {shown ? shown.key.split('_').join(' – ') : '\u00A0'}
      </div>
      {shown ? (
        <video
          ref={videoRef}
          className={styles.video}
          src={shown.url}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={fitRate}
        />
      ) : (
        <div className={styles.video} />
      )}
      {nextUrl && nextUrl !== shown?.url && (
        <video className={styles.preload} src={nextUrl} preload="auto" muted />
      )}
      <div className={`${styles.handle} ${styles.nw}`} onPointerDown={(e) => onResizeStart(e, true, true)} />
      <div className={`${styles.handle} ${styles.ne}`} onPointerDown={(e) => onResizeStart(e, false, true)} />
      <div className={`${styles.handle} ${styles.sw}`} onPointerDown={(e) => onResizeStart(e, true, false)} />
      <div className={`${styles.handle} ${styles.se}`} onPointerDown={(e) => onResizeStart(e, false, false)} />
    </div>
  )
}
