# Quiz Education — Project Overview

> Hệ thống quản lý lớp học và thi trắc nghiệm trực tuyến, full-stack TypeScript.

---

## 1. Tech Stack

| Layer | Technology | Chi tiết |
|---|---|---|
| Backend Runtime | Node.js + TypeScript | Express 5, strict typing throughout |
| Database | MongoDB + Mongoose 9 | Document-based, schema validation |
| Authentication | JWT (Access + Refresh) | 15m access token / 7d refresh token |
| Frontend | React + TypeScript | React Router v7, Vite |
| Styling | Tailwind CSS | CSS variables, dark mode, design tokens |
| Icons | Lucide React | Bộ icon nhất quán toàn app |
| Brand Color | `#008A50` | `var(--primary)`, green |
| Font | Outfit | Variable font, modern sans-serif |

---

## 2. Kiến Trúc Hệ Thống

### Backend — 4-Layer Architecture

```
Request → Controller → Service → Repository → MongoDB
                ↑           ↑
           auth middleware  AppError
```

| Layer | File | Trách nhiệm |
|---|---|---|
| **Model** | `*.model.ts` | Mongoose schema, interface, pre-save hooks |
| **Repository** | `*.repository.ts` | Toàn bộ MongoDB queries, không có business logic |
| **Service** | `*.service.ts` | Business logic, validation, orchestration |
| **Controller** | `*.controller.ts` | Parse request, gọi service, format response |

### Frontend — Feature-based Structure

```
src/
├── api/           # fetch wrappers typed, mỗi domain 1 file
├── types/         # interface definitions tách biệt
├── context/       # AuthContext, ProtectedRoute
├── components/    # Dashboard, DashboardLayout, ProfileModal...
└── pages/
    ├── admin/
    ├── teacher/
    └── student/
```

---

## 3. Chức Năng Hệ Thống

### 3.1 Authentication & Profile

| Tính năng | Endpoint | Mô tả |
|---|---|---|
| Đăng ký | `POST /api/auth/register` | Hash password bcryptjs (12 rounds) |
| Đăng nhập | `POST /api/auth/login` | Trả access + refresh token |
| Làm mới token | `POST /api/auth/refresh` | Rotate refresh token |
| Đăng xuất | `POST /api/auth/logout` | Xoá refresh token khỏi DB |
| Lấy thông tin | `GET /api/auth/me` | User hiện tại |
| Cập nhật profile | `PUT /api/auth/profile` | Đổi name, email |
| Đổi mật khẩu | `PUT /api/auth/change-password` | Verify current → hash new |

### 3.2 Quiz Management

| Tính năng | Endpoint | Chi tiết |
|---|---|---|
| CRUD Quiz | `GET/POST/PUT/DELETE /api/quizzes` | Teacher tạo, sửa, xoá quiz của mình |
| Publish/Unpublish | `PATCH /api/quizzes/:id/publish` | Toggle `isPublished` |
| Quiz công khai | `GET /api/quizzes/public` | Student xem quiz đã published |
| Chi tiết public | `GET /api/quizzes/public/:id` | Kèm `maxAttempts`, `userAttempts` |
| Admin xem tất cả | `GET /api/quizzes/all` | Kể cả quiz chưa publish |

### 3.3 Cài Đặt Quiz Nâng Cao

| Setting | Type | Mô tả |
|---|---|---|
| `maxAttempts` | `number` (0 = ∞) | Giới hạn số lần làm. Backend check trước khi grade. |
| `showAnswerAfter` | `boolean` (default: `true`) | Hiện đáp án đúng sau nộp. Backend ẩn `correctChoiceIndex` nếu `false`. |
| `lockAnswers` | `boolean` (default: `false`) | Khoá đáp án sau khi chọn, không cho đổi. |

### 3.4 Classroom Management

Luồng hoàn chỉnh: **Teacher tạo lớp → chia sẻ mã 6 ký tự → Student join → Teacher gán quiz → Student làm bài**

| Tính năng | Role | Endpoint |
|---|---|---|
| Tạo lớp | Teacher | `POST /api/classrooms` |
| Danh sách lớp của mình | Teacher | `GET /api/classrooms/my` |
| Cập nhật lớp | Teacher | `PUT /api/classrooms/:id` |
| Xoá lớp (soft delete) | Teacher | `DELETE /api/classrooms/:id` |
| Kick học sinh | Teacher | `DELETE /api/classrooms/:id/students/:sid` |
| Gán quiz vào lớp | Teacher | `POST /api/classrooms/:id/quizzes` |
| Bỏ quiz khỏi lớp | Teacher | `DELETE /api/classrooms/:id/quizzes/:qid` |
| Tham gia bằng mã | Student | `POST /api/classrooms/join` |
| Danh sách lớp đang học | Student | `GET /api/classrooms/enrolled` |
| Quiz published của lớp | Student | `GET /api/classrooms/:id/quizzes` |
| Rời lớp | Student | `DELETE /api/classrooms/:id/leave` |
| Xem tất cả lớp | Admin | `GET /api/classrooms/admin/all` |

> Mã tham gia 6 ký tự được tự sinh bằng `Math.random().toString(36)` trong Mongoose `pre('validate')` hook, lưu uppercase, có index để query nhanh.

### 3.5 Submissions & Grading

| Tính năng | Endpoint | Mô tả |
|---|---|---|
| Nộp bài | `POST /api/submissions/:quizId/submit` | Server grade, check maxAttempts, lưu DB |
| Kết quả của tôi | `GET /api/submissions/my-results` | Lịch sử làm bài, phân trang |
| Kết quả quiz | `GET /api/submissions/quiz/:quizId` | Teacher xem điểm từng student |
| Thống kê teacher | `GET /api/submissions/teacher/stats` | `topQuizzes`, `submissionsPerDay` |
| Thống kê admin | `GET /api/submissions/admin/stats` | `roleBreakdown`, system-wide stats |

---

## 4. Phân Quyền & Vai Trò

Hệ thống có **3 role** theo thứ bậc: `Admin > Teacher > Student`

Middleware `auth.middleware.ts` cung cấp 4 guard:

- `authenticate` — verify JWT, inject `req.user`
- `studentUp` — role phải là `student | teacher | admin`
- `teacherUp` — role phải là `teacher | admin`
- `adminOnly` — chỉ `admin`

### 4.1 Admin

| Chức năng | Endpoint | Ghi chú |
|---|---|---|
| CRUD Users | `CRUD /api/users` | Thay đổi role, reset tài khoản |
| Xem tất cả quiz | `GET /api/quizzes/all` | Kể cả quiz chưa publish |
| Xem tất cả lớp | `GET /api/classrooms/admin/all` | Bao gồm lớp inactive |
| Thống kê hệ thống | `GET /api/submissions/admin/stats` | `totalUsers`, `roleBreakdown`, `submissions/day` |
| Dashboard | `AdminDashboard` component | KPI cards + bar chart + user breakdown |

### 4.2 Teacher

| Chức năng | Endpoint / Component | Ghi chú |
|---|---|---|
| CRUD Quiz | `/api/quizzes` | Chỉ xem/sửa quiz do mình tạo |
| Cài đặt nâng cao | `QuizSettingsPanel` | `maxAttempts`, `showAnswerAfter`, `lockAnswers` |
| Tạo & quản lý lớp | `/api/classrooms` | Sinh mã 6 ký tự tự động |
| Gán quiz vào lớp | `POST /api/classrooms/:id/quizzes` | Quiz phải do teacher đó tạo |
| Kick học sinh | `DELETE .../students/:sid` | Xoá khỏi danh sách enrolled |
| Xem kết quả | `/api/submissions/quiz/:id` | Lọc theo quiz, phân trang |
| Thống kê cá nhân | `/api/submissions/teacher/stats` | Top quizzes, submissions per day |
| Dashboard | `TeacherDashboard` | Quiz list + top quiz + quick actions |

### 4.3 Student

| Chức năng | Endpoint / Component | Ghi chú |
|---|---|---|
| Tham gia lớp | `POST /api/classrooms/join` | Bằng mã 6 ký tự |
| Xem quiz từ lớp | `GET /api/classrooms/:id/quizzes` | Chỉ `isPublished = true` |
| Làm quiz | `StudentQuizPage` | Intro → Làm bài → Kết quả |
| Lịch sử làm bài | `GET /api/submissions/my-results` | Phân trang, accordion detail |
| Dashboard | `StudentDashboard` | KPI cards + quiz từ lớp enrolled |
| Rời lớp | `DELETE /api/classrooms/:id/leave` | — |
| Cập nhật profile | `PUT /api/auth/profile` | Đổi tên, email |
| Đổi mật khẩu | `PUT /api/auth/change-password` | Verify mật khẩu cũ trước |

### 4.4 Ma Trận Quyền Hạn

| Tính năng | Admin | Teacher | Student |
|---|:---:|:---:|:---:|
| Quản lý users | ✅ Full CRUD | ❌ | ❌ |
| Xem tất cả quiz | ✅ | ❌ (chỉ của mình) | ❌ (chỉ published) |
| Tạo / sửa quiz | ❌ | ✅ | ❌ |
| Tạo lớp học | ❌ | ✅ | ❌ |
| Gán quiz vào lớp | ❌ | ✅ | ❌ |
| Kick học sinh | ❌ | ✅ | ❌ |
| Tham gia lớp | ❌ | ❌ | ✅ |
| Làm quiz | ❌ | ❌ | ✅ |
| Thống kê hệ thống | ✅ | ❌ | ❌ |
| Thống kê cá nhân | ❌ | ✅ | ✅ |

---

## 5. Design Patterns

Hệ thống áp dụng **12 design patterns** từ 3 nhóm: Creational, Structural, Behavioral.

---

### 5.1 Singleton — Database Connection

**Vấn đề:** MongoDB chỉ nên có 1 connection pool duy nhất. Nếu mỗi module tạo connection mới, hệ thống cạn kiệt tài nguyên.

**Áp dụng:** `src/config/database.ts`

**Cách hoạt động:**
- Node.js module system chỉ evaluate mỗi file **một lần** và cache kết quả
- `mongoose.connect()` chỉ được gọi 1 lần khi server khởi động
- Mọi model chia sẻ cùng connection pool thông qua `mongoose.model()`
- Không thể có 2 instance Mongoose connection trong cùng process

```typescript
// database.ts được import ở server.ts → Node.js cache lại → mọi nơi dùng chung
import database from "./config/database";
database.connect(); // chỉ gọi 1 lần
```

---

### 5.2 Repository — Data Access Abstraction

**Vấn đề:** Nếu service trực tiếp gọi Mongoose, khi đổi database phải sửa toàn bộ business logic. Khó unit test vì phụ thuộc DB.

**Áp dụng:** `src/repositories/*.repository.ts`

| File | Methods chính |
|---|---|
| `classroom.repository.ts` | `findById`, `findByTeacher`, `findByStudent`, `findByCode`, `isEnrolled`, `addStudent`, `removeStudent`, `addQuiz ($ne dedup)`, `removeQuiz`, `softDelete` |
| `quiz.repository.ts` | `findByCreator`, `findPublished`, `findByIdForStudent` (ẩn `isCorrect`) |
| `user.repository.ts` | `findByEmail`, `findById`, `create`, `updateById` |
| `submission.repository.ts` | `findByStudent`, `findByQuiz`, `countByStudentAndQuiz` |

**Nguyên tắc:**
- Repository **chỉ** chứa Mongoose queries — không có `if/else` business logic
- Mọi `populate()`, `lean()`, `select()` chỉ nằm trong repository
- Service không bao giờ `import mongoose` hay gọi `Model.find()` trực tiếp

---

### 5.3 Service Layer — Business Logic Isolation

**Vấn đề:** Controller xử lý HTTP, không nên chứa business logic. Logic ở controller khó tái sử dụng và test.

**Áp dụng:** `src/services/*.service.ts`

**Ví dụ cụ thể:**
- `classroomService.assignQuiz()` kiểm tra `quiz.createdBy === teacherId` trước khi gán — đây là business rule, không phải query
- `classroomService.joinByCode()` gọi `isEnrolled()` rồi throw `ConflictError` nếu đã enrolled
- `submissionService.submit()` check `maxAttempts` → grade câu trả lời → tính `percent` → lưu DB
- Controller chỉ làm: `const result = await service.doSomething(params); sendSuccess(res, result)`

---

### 5.4 Factory Method — Error Creation

**Vấn đề:** Cần nhiều loại error với HTTP status codes khác nhau, không muốn hardcode số 404/403 rải rác khắp nơi.

**Áp dụng:** `src/errors/app.error.ts`

| Class | HTTP Status | Dùng khi |
|---|---|---|
| `AppError(msg, code)` | Custom | Base class |
| `NotFoundError(resource)` | 404 | Document không tồn tại trong DB |
| `ForbiddenError(msg?)` | 403 | Không đủ quyền truy cập resource |
| `ConflictError(msg)` | 409 | Trùng lặp (email đã tồn tại, quiz đã gán) |
| `ValidationError(msg)` | 422 | Dữ liệu đầu vào không hợp lệ |

```typescript
throw new NotFoundError("Lớp học");
// → { success: false, message: "Lớp học không tìm thấy" }, status 404
```

Error middleware bắt tất cả và format response nhất quán `{ success: false, message }`.

---

### 5.5 Chain of Responsibility — Middleware Pipeline

**Vấn đề:** Request cần đi qua nhiều bước xử lý độc lập theo thứ tự nhất định. Mỗi bước có thể dừng lại hoặc chuyển tiếp.

**Áp dụng:** Express middleware stack trong `server.ts` và `auth.middleware.ts`

```
Request
  → cors()                          # allow localhost:5173
  → express.json()                  # parse body
  → authenticate                    # verify JWT → inject req.user
  → studentUp | teacherUp | adminOnly  # check role
  → validateMiddleware (zod)        # validate body schema
  → controller handler              # business logic + response
  → errorHandler                    # catch mọi lỗi, format JSON
```

- Mỗi middleware gọi `next()` để tiếp tục, hoặc `next(err)` để nhảy thẳng tới `errorHandler`
- Thứ tự đăng ký route rất quan trọng: `/quizzes/public` phải đứng **TRƯỚC** `/quizzes/:id` trong `server.ts` nếu không Express sẽ match sai

---

### 5.6 Strategy — Role-Based Access Control

**Vấn đề:** Authorization thay đổi theo role tại runtime. Nếu dùng `if/else` trong route handler, code bị lặp và khó mở rộng.

**Áp dụng:** Guard functions trong `auth.middleware.ts`

```typescript
// Mỗi route chọn 1 strategy như tham số:
router.get("/my",        teacherUp,  getMyClassrooms);
router.get("/enrolled",  studentUp,  getEnrolled);
router.get("/admin/all", adminOnly,  getAllClassrooms);
```

- `studentUp`, `teacherUp`, `adminOnly` là 3 strategy độc lập, hoán đổi cho nhau
- Thêm role mới chỉ cần thêm 1 guard function — không sửa route nào
- Mỗi strategy là pure function `(req, res, next) => void`

---

### 5.7 Observer — Mongoose Lifecycle Hooks

**Vấn đề:** Side effects như hash password hay sinh mã lớp nên tự động xảy ra khi document thay đổi. Không thể để caller "nhớ" phải gọi thủ công.

**Áp dụng:** `pre` hooks trong Mongoose models

| Model | Hook | Hành động |
|---|---|---|
| `User` | `pre('save')` | `bcrypt.hash(password, 12)` nếu `isModified('password')` |
| `Classroom` | `pre('validate')` | Sinh mã 6 ký tự nếu `code` chưa tồn tại |

```typescript
// User model
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Classroom model
classroomSchema.pre("validate", function () {
  if (!this.code) {
    this.code = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
});
```

Hook chạy trước khi validate/save, không thể bị bỏ qua bởi caller.

---

### 5.8 Decorator — asyncHandler Wrapper

**Vấn đề:** Express không tự catch async errors. Mỗi controller phải bọc `try/catch` boilerplate — dễ bỏ sót, gây unhandled promise rejection.

**Áp dụng:** `asyncHandler` trong `src/utils/helpers.ts`

```typescript
// Không có asyncHandler — dễ quên try/catch:
router.get("/", async (req, res, next) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (err) { next(err); }   // ← dễ quên
});

// Với asyncHandler — sạch hoàn toàn:
router.get("/", asyncHandler(async (req, res) => {
  const data = await service.getAll();
  sendSuccess(res, data);
  // nếu throw → tự động gọi next(err)
}));
```

- `asyncHandler(fn)` nhận controller function, wrap trong `try/catch`
- Nếu `fn()` throw, tự động `next(err)` → error middleware xử lý
- Không có `try/catch` nào trong controller — code ngắn hơn, không bỏ sót

---

### 5.9 Template Method — Response Formatting

**Vấn đề:** Mọi API response phải có format nhất quán để frontend dễ xử lý. Không thể để mỗi controller viết `res.json()` theo format khác nhau.

**Áp dụng:** Helper functions trong `helpers.ts`

```typescript
sendSuccess(res, data, message?)
// → 200 { success: true, data, message }

sendCreated(res, data, message?)
// → 201 { success: true, data, message }

// errorHandler tự động:
// → { success: false, message: err.message }
```

Template cố định cho `success`, `data`, `message` — controller chỉ điền nội dung, không định nghĩa lại cấu trúc.

---

### 5.10 Proxy — HTTP Interceptor (Auto Token Refresh)

**Vấn đề:** Access token hết hạn sau 15 phút. Cần tự động refresh mà không làm gián đoạn UX — user không nên bị đăng xuất giữa chừng.

**Áp dụng:** `src/utils/http.ts` ở frontend

```
API call → http.ts (proxy)
              ↓
         Response 401?
         ├── YES → POST /auth/refresh → lấy token mới → retry request gốc
         │           └── Refresh fail? → logout → redirect /login
         └── NO  → trả response về component
```

- `http.ts` wrap `fetch()`, hoàn toàn transparent với component
- Component chỉ gọi `classroomApi.enrolled()` — không biết gì về token refresh
- Tất cả API calls của student/teacher/admin đều qua `http.ts`

---

### 5.11 Facade — API Layer

**Vấn đề:** Component cần gọi nhiều endpoints với auth headers, error handling. Nếu gọi `fetch()` trực tiếp trong component, logic bị lặp và URL/header bị hardcode khắp nơi.

**Áp dụng:** `src/api/*.ts`

| File | Facade cho |
|---|---|
| `classroomApi.ts` | 12 operations: `create`, `myClasses`, `getOne`, `update`, `remove`, `kickStudent`, `assignQuiz`, `removeQuiz`, `join`, `enrolled`, `leave`, `classQuizzes` |
| `dashboardApi.ts` | `adminStats`, `teacherStats`, `myResults`, `myQuizzes` |
| `submissionApi.ts` | `submit`, `myResults`, `quizResults`, `adminStats`, `teacherStats` |
| `studentQuizApi.ts` | `getAll` (public quiz list), `getById` (quiz detail) |

```typescript
// Component chỉ làm:
const classes = await classroomApi.enrolled();
// Không biết URL, headers, error format, base path
```

---

### 5.12 Composite — Nested Document Structure (Quiz)

**Vấn đề:** Quiz chứa Questions, mỗi Question chứa Choices. Cần lưu trữ và truy xuất cấu trúc lồng nhau hiệu quả.

**Áp dụng:** Quiz model với embedded documents (MongoDB)

```
IQuiz
  └── IQuestion[]          (embedded trong cùng collection)
        └── IChoice[]      (nested thêm 1 lớp)
              ├── text
              └── isCorrect
```

- Không cần JOIN — 1 query lấy toàn bộ quiz với questions và choices
- Khi student lấy quiz để làm bài, repository dùng `.select("-questions.choices.isCorrect")` để ẩn đáp án
- Khi chấm điểm, server so sánh `choices[choiceIndex].isCorrect`
- `correctChoiceIndex` chỉ được trả về sau khi nộp bài, và chỉ khi `showAnswerAfter = true`

---

### 5.13 Context / Observer — React Auth State

**Vấn đề:** User info và auth state cần chia sẻ giữa hàng chục components không liên quan trực tiếp (`DashboardLayout`, `ProtectedRoute`, `Dashboard`, `ProfileModal`...). Prop drilling không thực tế.

**Áp dụng:** `src/context/AuthContext.tsx`

```typescript
// AuthContext cung cấp:
{
  user,              // thông tin user hiện tại
  accessToken,       // để http.ts đính vào header
  login(),           // lưu tokens, update state
  logout(),          // xoá tokens, redirect
  updateProfile(),   // PATCH /auth/profile → cập nhật user trong context
  changePassword(),  // POST /auth/change-password
}
```

- `ProtectedRoute` subscribe Context, tự redirect nếu `!user`
- `DashboardLayout` hiển thị avatar và tên từ Context
- `ProfileModal` gọi `updateProfile()` → Context broadcast xuống toàn bộ tree
- `localStorage` đồng bộ auth state qua page refresh

---

## 6. Data Models

### User
| Field | Type | Ghi chú |
|---|---|---|
| `name` | String | required, trim |
| `email` | String | required, unique, lowercase |
| `password` | String | `select: false`, bcrypt hash |
| `role` | Enum | `admin \| teacher \| student`, default: `student` |
| `refreshToken` | String | `select: false`, dùng để verify/rotate |

### Quiz
| Field | Type | Ghi chú |
|---|---|---|
| `title` | String | required |
| `subject` | String | required |
| `duration` | Number | phút |
| `questions` | `IQuestion[]` | embedded: `text`, `choices[]`, `explanation`, `order` |
| `createdBy` | ObjectId→User | ref |
| `isPublished` | Boolean | default: `false` |
| `maxAttempts` | Number | 0 = không giới hạn |
| `showAnswerAfter` | Boolean | default: `true` |
| `lockAnswers` | Boolean | default: `false` |

### Classroom
| Field | Type | Ghi chú |
|---|---|---|
| `name` | String | required |
| `code` | String | 6 ký tự uppercase, unique, index |
| `teacherId` | ObjectId→User | ref |
| `students` | `ObjectId[]→User` | danh sách enrolled |
| `quizzes` | `ObjectId[]→Quiz` | quizzes được gán |
| `isActive` | Boolean | soft delete flag |

### Submission
| Field | Type | Ghi chú |
|---|---|---|
| `quizId` | ObjectId→Quiz | ref |
| `studentId` | ObjectId→User | ref |
| `answers` | `IAnswer[]` | `questionId`, `choiceIndex`, `isCorrect` |
| `score` | Number | số câu đúng |
| `percent` | Number | `score/total * 100` |
| `timeTaken` | Number | giây |

---

## 7. Frontend Pages

| Role | Route | Component | Chức năng |
|---|---|---|---|
| Admin | `/admin` | `AdminDashboard` | KPI + roleBreakdown + bar chart |
| Admin | `/admin/users` | `AdminUsersPage` | CRUD users |
| Admin | `/admin/quizzes` | `AdminQuizzesPage` | Xem tất cả quiz |
| Admin | `/admin/stats` | `AdminStatsPage` | Biểu đồ hệ thống |
| Teacher | `/teacher` | `TeacherDashboard` | Quiz list + top quiz + quick links |
| Teacher | `/teacher/quizzes` | `TeacherQuizzesPage` | Quản lý quiz |
| Teacher | `/teacher/quizzes/create` | `QuizFormPage` | Tạo quiz + settings panel |
| Teacher | `/teacher/classrooms` | `TeacherClassroomsPage` | Quản lý lớp, gán quiz, kick student |
| Teacher | `/teacher/results` | `TeacherResultsPage` | Xem điểm học sinh |
| Teacher | `/teacher/stats` | `TeacherStatsPage` | Thống kê cá nhân |
| Student | `/student` | `StudentDashboard` | KPI + quiz từ lớp enrolled |
| Student | `/student/quizzes` | `StudentQuizzesPage` | Quiz từ lớp (filter: subject, class) |
| Student | `/student/quizzes/:id` | `StudentQuizPage` | Làm bài (4 phases) |
| Student | `/student/classrooms` | `StudentClassroomsPage` | Tham gia/xem lớp |
| Student | `/student/results` | `StudentResultsPage` | Lịch sử làm bài (accordion) |

### StudentQuizPage — 4 Phases

| Phase | Hiển thị | Logic |
|---|---|---|
| `intro` | Tên quiz, thông tin, attempt count | Disable nút nếu hết `maxAttempts` |
| `doing` | Câu hỏi + choices + timer + navigator | `lockAnswers` khoá lựa chọn đã chọn |
| `submitting` | Spinner | `POST /api/submissions/:id/submit` |
| `finished` | Score card + answer review | `showAnswerAfter` hiện `correctChoiceIndex` |

---

## 8. Toàn Bộ API Routes

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout         [auth]
GET    /api/auth/me             [auth]
PUT    /api/auth/profile        [auth]
PUT    /api/auth/change-password [auth]
```

### Users (Admin)
```
GET    /api/users               [adminOnly]
POST   /api/users               [adminOnly]
GET    /api/users/:id           [adminOnly]
PUT    /api/users/:id           [adminOnly]
DELETE /api/users/:id           [adminOnly]
```

### Quizzes
```
GET    /api/quizzes/all         [adminOnly]
GET    /api/quizzes             [teacherUp]
POST   /api/quizzes             [teacherUp]
GET    /api/quizzes/:id         [teacherUp]
PUT    /api/quizzes/:id         [teacherUp]
DELETE /api/quizzes/:id         [teacherUp]
PATCH  /api/quizzes/:id/publish [teacherUp]
GET    /api/quizzes/public      [studentUp]
GET    /api/quizzes/public/:id  [studentUp]
```

### Submissions
```
POST   /api/submissions/:quizId/submit    [studentUp]
GET    /api/submissions/my-results        [studentUp]
GET    /api/submissions/quiz/:quizId      [teacherUp]
GET    /api/submissions/teacher/stats     [teacherUp]
GET    /api/submissions/admin/stats       [adminOnly]
```

### Classrooms
```
# Static paths trước param paths (quan trọng!)
POST   /api/classrooms/join              [studentUp]
GET    /api/classrooms/enrolled          [studentUp]
GET    /api/classrooms/admin/all         [adminOnly]
POST   /api/classrooms                   [teacherUp]
GET    /api/classrooms/my                [teacherUp]
GET    /api/classrooms/:id/quizzes       [studentUp]
DELETE /api/classrooms/:id/leave         [studentUp]
GET    /api/classrooms/:id               [teacherUp]
PUT    /api/classrooms/:id               [teacherUp]
DELETE /api/classrooms/:id               [teacherUp]
DELETE /api/classrooms/:id/students/:sid [teacherUp]
POST   /api/classrooms/:id/quizzes       [teacherUp]
DELETE /api/classrooms/:id/quizzes/:qid  [teacherUp]
```

---

## 🚀 Hướng Dẫn Cài Đặt Và Chạy Dự Án

Dự án này sử dụng Node.js, TypeScript (Express 5) cho Backend và React (Vite) cho Frontend. Dưới đây là các bước để khởi chạy hệ thống trên môi trường local:

### 1. Yêu Cầu Hệ Thống 
* Cài đặt phiên bản Node.js ổn định.
* Cài đặt MongoDB trên máy hoặc chuẩn bị sẵn chuỗi kết nối (URI) tới cơ sở dữ liệu MongoDB.

### 2. Cài Đặt Các Gói Phụ Thuộc 
* Mở Terminal tại thư mục gốc của dự án.
* Di chuyển vào thư mục Backend và chạy lệnh: `npm install`
* Di chuyển vào thư mục Frontend và chạy lệnh: `npm install`

### 3. Khởi Chạy Hệ Thống
* **Khởi chạy Backend:** Mở Terminal ở thư mục Backend và chạy lệnh khởi động môi trường dev (thường là `npm run dev`).
* **Khởi chạy Frontend:** Mở thêm một Terminal mới ở thư mục Frontend và chạy lệnh `npm run dev`.
* Truy cập vào đường dẫn máy chủ cục bộ do Vite cung cấp (thường là `http://localhost:5173`) trên trình duyệt.

---

## 🔐 Tài Khoản Truy Cập Mặc Định

Sau khi khởi chạy thành công, bạn có thể sử dụng tài khoản có sẵn dưới đây để đăng nhập và trải nghiệm các tính năng cấp cao nhất của hệ thống:

| Vai trò | Email | Mật khẩu | Chức năng chính |
|---|---|---|---|
| **Admin** | `admin@quiz.com` | `123456` | Quản lý người dùng, xem toàn bộ lớp học, xem toàn bộ quiz và thống kê hệ thống |

