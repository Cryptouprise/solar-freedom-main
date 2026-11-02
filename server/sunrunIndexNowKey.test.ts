import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {PUBLIC_PATH_REDIRECTS} from './seo-redirects';

describe('Sunrun Solar Relief public key and route boundary',()=>{
  const key='5a51ae4fc501a309d6303c76d64eeb28';
  it('ships the requested public IndexNow verification file as one line',()=>{
    expect(key).toMatch(/^[a-f0-9]{32}$/);
    expect(fs.readFileSync(`client/public/${key}.txt`,'utf8')).toBe(`${key}\n`);
  });
  it('preserves the existing exact Sunrun redirect without a sub-site prefix redirect',()=>{
    expect(PUBLIC_PATH_REDIRECTS['/sunrun']).toBe('/blog/sunrun-solar-contract-cancellation-2026');
    for(const path of ['/sunrun-solar-relief','/sunrun-solar-relief/','/sunrun-solar-relief/sunrun-contract-cancellation']) expect(Object.hasOwn(PUBLIC_PATH_REDIRECTS,path)).toBe(false);
    const source=fs.readFileSync('server/_core/index.ts','utf8');
    expect(source).toContain('app.get(from, (_req, res) => res.redirect(301, to))');
  });
});
