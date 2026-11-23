## Resumen del cambio

<!-- Describí brevemente qué hace este PR y, si forma parte de una feature grande dividida en partes, indicá qué parte cubre y de qué rama depende. -->

- **Rama destino:**
  - [ ] `staging` (para toda nueva funcionalidad, mejora o corrección)
  - [ ] `main` (exclusivamente para promover cambios ya validados en `staging`)

## Checklist de verificación

- [ ] `node --test scripts/*.test.mjs` ejecutado en `frontend/` sin fallos
- [ ] `npm run build` ejecutado en `frontend/` sin errores
- [ ] Probado en entorno local o Preview/Staging (Vercel)
- [ ] Si se agregan variables de entorno nuevas, quedaron documentadas en `frontend/.env.local.example`
- [ ] Ningún secreto, token ni credencial quedó expuesto en código o en variables `NEXT_PUBLIC_*`

## Evidencia / Notas para revisión

<!-- Opcional: capturas, URL de preview en Vercel o pasos manuales realizados. -->
