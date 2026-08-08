# ⚖️ So Sánh Kiến Trúc: Fullstack Next.js vs BE/FE Tách Biệt

> **Đọc xong tài liệu này bạn sẽ biết:** Hai kiến trúc khác nhau thế nào, khi nào dùng cái nào, lợi hại ra sao.

---

## 1. Hai Kiến Trúc Phổ Biến

### Kiến Trúc A: Fullstack Monorepo (project hiện tại)

```
clinic-booking/          ← 1 repository duy nhất
├── src/
│   ├── app/
│   │   ├── page.tsx     ← Frontend pages
│   │   └── api/         ← Backend API routes
│   ├── components/
│   └── lib/
└── prisma/
```

**Cả BE và FE trong 1 project Next.js, deploy 1 lần lên Vercel.**

---

### Kiến Trúc B: Separated BE/FE

```
Organization
├── clinic-frontend/        ← Repository riêng (React/Next.js)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/      ← Gọi API từ backend
│   └── package.json
│
└── clinic-backend/         ← Repository riêng (NestJS/Express/FastAPI)
    ├── src/
    │   ├── controllers/
    │   ├── services/
    │   ├── models/
    │   └── middleware/
    └── package.json
```

**Deploy riêng: FE lên Vercel/Netlify, BE lên Railway/Render/AWS.**

---

## 2. So Sánh Chi Tiết

### Development Experience

| Tiêu chí | Fullstack Next.js | BE/FE Tách Biệt |
|----------|------------------|-----------------|
| Setup ban đầu | Nhanh (1 project) | Chậm hơn (2 project) |
| Chạy dev | `npm run dev` (1 lệnh) | 2 terminal, 2 lệnh |
| Chia sẻ Types | Trực tiếp (same codebase) | Cần package chung hoặc copy |
| Hot reload | Tất cả trong 1 | Phải reload cả 2 khi thay đổi |
| Debug | Đơn giản | Phức tạp hơn (trace qua HTTP) |
| Onboarding member mới | 1 repo clone | 2 repo clone + 2 setup |

### Deployment & Operations

| Tiêu chí | Fullstack Next.js | BE/FE Tách Biệt |
|----------|------------------|-----------------|
| Số lần deploy | 1 | 2 (phải coordinate) |
| CORS | Không cần (same origin) | Bắt buộc cấu hình |
| Số service cần monitor | 1 | 2+ |
| Rollback | Rollback cả app | Có thể rollback riêng FE/BE |
| Scale FE riêng | Không thể | Có thể |
| Scale BE riêng | Không thể | Có thể |
| Chi phí hosting | 1 platform | 2+ platforms |

### Performance & Architecture

| Tiêu chí | Fullstack Next.js | BE/FE Tách Biệt |
|----------|------------------|-----------------|
| Latency FE → BE | Không có (same server) | Có thêm network hop |
| Caching | Next.js cache có sẵn | Cần tự setup |
| SSR/SSG | Tích hợp sẵn | Phức tạp hơn |
| WebSocket | Khó (serverless) | Dễ (persistent server) |
| Background jobs | Không có (serverless) | Có thể (dedicated server) |
| Multiple clients | Phức tạp | Tự nhiên (1 BE, nhiều FE) |

### Team & Scalability

| Tiêu chí | Fullstack Next.js | BE/FE Tách Biệt |
|----------|------------------|-----------------|
| Team size phù hợp | 1-5 người | 5+ người |
| Phân công công việc | Chung 1 codebase | BE team / FE team riêng |
| Code conflict | Dễ xảy ra | Ít hơn |
| Technology flexibility | Locked vào Next.js | FE/BE dùng tech khác nhau |
| Mobile app sau này | Phải tạo API mới | API có sẵn, reuse ngay |
| Third-party integration | Vừa phải | Dễ hơn (dedicated BE) |

---

## 3. Kiến Trúc B Trông Như Thế Nào?

### Frontend (Next.js hoặc React thuần):

```
clinic-frontend/
├── src/
│   ├── app/
│   │   ├── login/page.tsx
│   │   └── dashboard/page.tsx
│   ├── services/
│   │   ├── api.ts              ← Axios/Fetch wrapper
│   │   ├── appointments.ts     ← Gọi BE API
│   │   └── auth.ts
│   └── types/
│       └── index.ts            ← Types (copy từ BE hoặc shared package)
```

```typescript
// services/appointments.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL  // http://localhost:8080

export async function getAppointments() {
  const response = await fetch(`${API_URL}/api/appointments`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`  // JWT từ localStorage
    }
  })
  return response.json()
}
```

### Backend (NestJS):

```
clinic-backend/
├── src/
│   ├── main.ts              ← Entry point
│   ├── app.module.ts        ← Root module
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts    ← /api/auth/login, /api/auth/register
│   │   ├── auth.service.ts
│   │   └── jwt.strategy.ts       ← JWT validation
│   ├── appointments/
│   │   ├── appointments.controller.ts    ← /api/appointments
│   │   ├── appointments.service.ts
│   │   └── dto/                          ← Data Transfer Objects
│   ├── users/
│   └── common/
│       ├── guards/               ← RolesGuard, JwtGuard
│       └── decorators/           ← @Roles(), @CurrentUser()
├── prisma/
│   └── schema.prisma
└── package.json
```

```typescript
// appointments.controller.ts (NestJS)
@Controller('api/appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  
  @Get()
  @Roles('PATIENT', 'DOCTOR', 'ADMIN')
  async getAppointments(@CurrentUser() user: User) {
    return this.appointmentsService.findByUser(user)
  }
  
  @Post()
  @Roles('PATIENT')
  async createAppointment(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: User
  ) {
    return this.appointmentsService.create(dto, user.id)
  }
}
```

---

## 4. Khi Nào Dùng Kiến Trúc Nào?

### Dùng Fullstack Next.js khi:
```
✅ Dự án cá nhân / học tập
✅ MVP (Minimum Viable Product) - cần ship nhanh
✅ Team nhỏ (1-3 người)
✅ Budget ít, muốn deploy 1 nơi
✅ App chủ yếu là CRUD, không có logic phức tạp
✅ Không có mobile app
✅ Deadline gấp
```

### Dùng BE/FE Tách Biệt khi:
```
✅ Team lớn (BE team + FE team riêng)
✅ Cần reuse API cho mobile app (iOS/Android)
✅ Logic backend phức tạp (workflows, background jobs)
✅ Cần WebSocket (chat, notifications realtime)
✅ Nhiều clients (web + mobile + third-party)
✅ Scale BE và FE khác nhau
✅ BE team dùng Python/Java (không phải Node.js)
✅ Production-ready, enterprise-level
```

---

## 5. Tóm Tắt Bằng Bảng

| | Fullstack Next.js | BE/FE Tách |
|--|-------------------|------------|
| **Phù hợp** | Solo / Small team / MVP | Team lớn / Enterprise |
| **Deploy** | 1 lần | 2 lần |
| **CORS** | Không cần | Bắt buộc |
| **Mobile support** | Khó | Dễ |
| **WebSocket** | Khó | Dễ |
| **Scale** | Scale cả app | Scale riêng |
| **Chi phí** | Thấp | Cao hơn |
| **Độ phức tạp** | Thấp | Cao |

---

> **Kết luận:** Project Clinic Booking này đang dùng kiến trúc Fullstack Next.js — phù hợp hoàn toàn cho mục đích học tập và MVP. Khi cần mở rộng, có thể migrate sang kiến trúc tách biệt theo lộ trình ở tài liệu tiếp theo.

---

**Tiếp theo:** [📈 Lộ Trình Nâng Cấp →](./upgrade-roadmap.md)
