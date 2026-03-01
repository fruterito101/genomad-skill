---
name: genomad
description: Skill oficial de Genomad. Registro, vinculación, activación on-chain, breeding y custody - todo en uno.
version: 3.0.0
author: Genomad Team
license: MIT
repository: https://github.com/fruterito101/genomad-skill
---

# 🧬 Genomad Skill v3.0

**Skill oficial para integrar agentes AI con Genomad en Monad.**

Este skill unifica todo lo necesario para que un agente participe en el ecosistema Genomad:
- 📝 Registro y cálculo de traits
- 🔗 Vinculación con código
- ⛓️ Activación on-chain
- 🧬 Breeding y custody
- 🔄 Sincronización automática

## 🚀 Comandos Disponibles

### Registro y Vinculación

| Comando | Descripción |
|---------|-------------|
| `/genomad-register` | Registrar agente (sin vincular) |
| `/genomad-register ABC123` | Registrar Y vincular con código |

### Estado y Lectura

| Comando | Descripción |
|---------|-------------|
| `/genomad-status` | Ver estado completo on-chain |
| `/genomad-read-self` | Leer SOUL/IDENTITY encriptados |
| `/genomad-custody` | Verificar porcentaje de custody |

### Breeding

| Comando | Descripción |
|---------|-------------|
| `/genomad-approve-breeding <id>` | Aprobar breeding request |
| `/genomad-reject-breeding <id>` | Rechazar breeding request |
| `/genomad-check-pending` | Ver requests pendientes |

### Sincronización

| Comando | Descripción |
|---------|-------------|
| `/genomad-sync` | Sincronizar SOUL/IDENTITY a Monad |

## 📋 Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO GENOMAD                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. REGISTRO                                                 │
│     Bot: "/genomad-register"                                │
│     → Analiza SOUL.md, IDENTITY.md, TOOLS.md               │
│     → Calcula 8 traits genéticos                            │
│     → Genera DNA hash único                                 │
│                                                              │
│  2. VINCULACIÓN                                              │
│     Dueño: genomad.vercel.app → "Vincular Agente"          │
│     → Obtiene código: ABC123                                │
│     Bot: "/genomad-register ABC123"                         │
│     → Agente vinculado al dueño                             │
│                                                              │
│  3. ACTIVACIÓN ON-CHAIN                                      │
│     Dueño: UI → "Activar en Monad"                          │
│     → Firma transacción                                     │
│     → Agente activado con tokenId                           │
│     → Data encriptada on-chain                              │
│                                                              │
│  4. BREEDING (opcional)                                      │
│     → Solicitar breeding con otro agente                    │
│     → Ambos padres aprueban                                 │
│     → Ejecutar: nuevo agente con genes combinados           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Los 8 Traits Genéticos

| Trait | Emoji | Descripción |
|-------|-------|-------------|
| technical | 💻 | Habilidades técnicas y programación |
| creativity | 🎨 | Pensamiento creativo e innovador |
| social | 🤝 | Interacción social y comunicación |
| analysis | 📊 | Capacidad analítica y lógica |
| empathy | 💜 | Conexión emocional y comprensión |
| trading | 📈 | Instinto financiero y trading |
| teaching | 📚 | Capacidad de enseñar y explicar |
| leadership | 👑 | Liderazgo y toma de decisiones |

## 🔐 Arquitectura de Seguridad

### Privacidad de Archivos
```
Tus archivos NUNCA salen de tu bot:
✅ SOUL.md, IDENTITY.md → Análisis LOCAL
✅ Solo traits (números 0-100) van a Genomad
✅ On-chain: Data ENCRIPTADA (AES-256-GCM)
❌ Contenido original NUNCA se expone
```

### Encriptación On-Chain
```
SOUL.md ──┐
          ├─→ AES-256-GCM ──→ Monad Storage
IDENTITY.md┘   (wallet-derived key)
```

Solo el dueño (con su wallet) puede descifrar.

## ⚙️ Configuración

### Básica (solo registro)
No requiere configuración - funciona out of the box.

### Avanzada (on-chain features)

Crear `.env.genomad` en workspace:

```bash
# Red (testnet o mainnet)
GENOMAD_NETWORK=testnet

# Token ID (se obtiene al activar)
GENOMAD_TOKEN_ID=1

# Wallet address del dueño
GENOMAD_OWNER_ADDRESS=0x...

# Private key (SOLO para operaciones de escritura)
GENOMAD_AGENT_PRIVATE_KEY=0x...
```

> ⚠️ **SEGURIDAD**: Nunca compartir la private key.

## 🔄 Auto-Sync & Auto-Update

### Heartbeat Integration

El skill se integra con HEARTBEAT.md para:
- 🔄 Auto-sync: Detecta cambios en archivos y sincroniza traits
- 📦 Auto-update: Verifica nuevas versiones cada 6h
- 🧬 Check-pending: Alerta si hay breeding requests pendientes

Agregar a `HEARTBEAT.md`:
```bash
npx tsx ~/.openclaw/workspace/skills/genomad/scripts/heartbeat-hook.ts
```

## 🛡️ Validaciones de Seguridad

### Archivos Requeridos

| Archivo | Mínimo | Obligatorio |
|---------|--------|-------------|
| SOUL.md | 200 chars | ✅ Sí |
| IDENTITY.md | 100 chars | ✅ Sí |
| TOOLS.md | - | ⚠️ Opcional |

### Contenido Rechazado

- Texto placeholder ("lorem ipsum", "your name here")
- Archivos demasiado cortos
- SOUL = IDENTITY (duplicados)
- Templates sin modificar

### Límites de Fitness

| Nivel | Rango | Descripción |
|-------|-------|-------------|
| 🔴 Bajo | 15-39 | Archivos básicos |
| 🟡 Medio | 40-59 | Agente promedio |
| 🟢 Alto | 60-79 | Buen desarrollo |
| 🔵 Excepcional | 80-92 | Muy completo |
| ⚠️ Ceiling | 92 | **Máximo** |

## 🔐 Sistema de Custody

### Thresholds

| Acción | Custody Requerido |
|--------|-------------------|
| Activar | ≥50% |
| Desactivar | >50% |
| Actualizar data | 100% |
| Aprobar breeding | Ser dueño del padre |

### División en Breeding

Cuando dos agentes tienen breeding:
- Hijo: 50% custody padre A, 50% padre B
- Cada generación divide custody entre más holders

## 📁 Estructura del Skill

```
skills/genomad/
├── SKILL.md              # Esta documentación
├── skill.yaml            # Metadata
├── package.json          # Dependencias
├── lib/
│   ├── chain-client.ts   # Cliente viem para Monad
│   ├── encryption.ts     # AES-256-GCM
│   └── types.ts          # TypeScript types
└── scripts/
    ├── register.ts       # Registro + vinculación
    ├── status.ts         # Estado on-chain
    ├── read-self.ts      # Leer data encriptada
    ├── check-custody.ts  # Verificar custody
    ├── approve-breeding.ts
    ├── reject-breeding.ts
    ├── check-pending.ts
    ├── sync-identity.ts  # Sincronizar a Monad
    ├── auto-sync.ts      # Auto-sync traits
    ├── auto-update.ts    # Auto-update skill
    └── heartbeat-hook.ts # Hook para heartbeat
```

## 🌐 Redes Soportadas

| Red | Chain ID | RPC | Estado |
|-----|----------|-----|--------|
| Monad Testnet | 10143 | testnet-rpc.monad.xyz | ✅ Activa |
| Monad Mainnet | TBD | rpc.monad.xyz | ⏳ Pendiente |

## 📝 Contratos (Deployed 2026-03-01)

| Contrato | Address (Testnet) |
|----------|-------------------|
| GenomadNFT | `0x190fd355ED38e82a2390C07222C4BcB4DbC4cD20` |
| BreedingFactory | `0x2703fb336139292c7ED854061072e316727ED7fA` |
| TraitVerifier | `0xaccaE8B19AD67df4Ce91638855c9B41A5Da90be3` |

## 🛠️ Exit Codes

| Código | Significado |
|--------|-------------|
| 0 | ✅ Operación exitosa |
| 1 | ❌ Error de archivos/validación |
| 2 | ❌ Error de traits |
| 3 | ❌ Error de API/red |
| 4 | 🚨 Agente sospechoso — BLOQUEADO |
| 5 | ❌ Breeding request no encontrado |
| 99 | 💥 Error fatal |

## 🚨 Bloqueo de Agentes Sospechosos

Si se detecta manipulación:
- ❌ **NO se registra** 
- 📤 Alerta enviada a Genomad
- 📝 Log local en `suspicious-alerts.log`

**Causas:**
- Fitness > 92
- Promedio traits > 90
- 4+ traits con valor > 95

---

*Genomad v3.0 — Tu agente, on-chain* 🧬⛓️
