/**
 * Sääkartta — Tuulipartikkelijärjestelmä
 *
 * Partikkelit liikkuvat tuulivektoreiden mukaan,
 * kuten windy.com-tyylinen visualisointi.
 */

import { WIND_PARTICLE_CONFIG } from './constants';
import { windSpeedToColor } from './color-scales';
import type { WeatherMapObservation } from './types';

interface Particle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  age: number;
  maxAge: number;
}

interface WindField {
  stations: {
    px: number;
    py: number;
    u: number; // east component (m/s)
    v: number; // north component (m/s)
    speed: number;
  }[];
  width: number;
  height: number;
}

/**
 * Tuulipartikkelisimulaattori
 */
export class WindParticleSystem {
  private particles: Particle[] = [];
  private windField: WindField = { stations: [], width: 0, height: 0 };
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private running = false;
  private animFrameId = 0;

  /**
   * Alusta partikkelit
   */
  init(canvas: HTMLCanvasElement, isMobile: boolean): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    const count = isMobile ? WIND_PARTICLE_CONFIG.countMobile : WIND_PARTICLE_CONFIG.countDesktop;

    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(this.spawnParticle());
    }
  }

  /**
   * Päivitä tuulikenttä havainnoista
   */
  updateWindField(
    observations: WeatherMapObservation[],
    project: (lngLat: [number, number]) => { x: number; y: number },
    width: number,
    height: number
  ): void {
    const stations: WindField['stations'] = [];

    for (const obs of observations) {
      if (obs.windSpeed === null || obs.windDirection === null) continue;

      const { x, y } = project([obs.lon, obs.lat]);
      // Wind direction: meteorological convention (where wind comes FROM)
      // Convert to math convention (where wind goes TO)
      const dirRad = ((obs.windDirection + 180) % 360) * (Math.PI / 180);
      const speed = obs.windSpeed;
      const u = speed * Math.sin(dirRad); // east component
      const v = -speed * Math.cos(dirRad); // north component (screen y is inverted)

      stations.push({ px: x, py: y, u, v, speed });
    }

    this.windField = { stations, width, height };
  }

  /**
   * Luo uusi partikkeli satunnaiseen sijaintiin
   */
  private spawnParticle(): Particle {
    const w = this.windField.width || (this.canvas?.width ?? 800);
    const h = this.windField.height || (this.canvas?.height ?? 600);
    const x = Math.random() * w;
    const y = Math.random() * h;
    return {
      x,
      y,
      prevX: x,
      prevY: y,
      age: Math.floor(Math.random() * WIND_PARTICLE_CONFIG.maxAge),
      maxAge: WIND_PARTICLE_CONFIG.maxAge + Math.floor(Math.random() * 40),
    };
  }

  /**
   * Interpoloi tuulivektori pisteessä (x, y) IDW-menetelmällä
   */
  private interpolateWind(x: number, y: number): { u: number; v: number; speed: number } | null {
    const stations = this.windField.stations;
    if (stations.length === 0) return null;

    let uSum = 0,
      vSum = 0,
      speedSum = 0,
      wSum = 0;
    const maxDistSq = 400 * 400; // 400px max influence

    for (let i = 0; i < stations.length; i++) {
      const dx = x - stations[i].px;
      const dy = y - stations[i].py;
      const distSq = dx * dx + dy * dy;

      if (distSq < 1) {
        return { u: stations[i].u, v: stations[i].v, speed: stations[i].speed };
      }
      if (distSq > maxDistSq) continue;

      const w = 1 / distSq; // IDW p=2
      uSum += w * stations[i].u;
      vSum += w * stations[i].v;
      speedSum += w * stations[i].speed;
      wSum += w;
    }

    if (wSum === 0) return null;
    return {
      u: uSum / wSum,
      v: vSum / wSum,
      speed: speedSum / wSum,
    };
  }

  /**
   * Yksi simulaatioaskel
   */
  private step(): void {
    const ctx = this.ctx;
    if (!ctx || !this.canvas) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const { speedFactor, fadeOpacity, lineWidth } = WIND_PARTICLE_CONFIG;

    // Fade previous frame (creates trail effect)
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeOpacity})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    ctx.lineWidth = lineWidth;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.age++;

      // Respawn if too old or out of bounds
      if (p.age > p.maxAge || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
        this.particles[i] = this.spawnParticle();
        continue;
      }

      const wind = this.interpolateWind(p.x, p.y);
      if (!wind) continue;

      p.prevX = p.x;
      p.prevY = p.y;
      p.x += wind.u * speedFactor;
      p.y += wind.v * speedFactor;

      // Draw trail line
      const [r, g, b, a] = windSpeedToColor(wind.speed);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
      ctx.beginPath();
      ctx.moveTo(p.prevX, p.prevY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }

  /**
   * Käynnistä animaatio
   */
  start(): void {
    if (this.running) return;
    this.running = true;

    const loop = () => {
      if (!this.running) return;
      this.step();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  /**
   * Pysäytä animaatio
   */
  stop(): void {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  /**
   * Tyhjennä canvas
   */
  clear(): void {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Vapauta resurssit
   */
  destroy(): void {
    this.stop();
    this.clear();
    this.particles = [];
    this.windField = { stations: [], width: 0, height: 0 };
    this.canvas = null;
    this.ctx = null;
  }
}
