# 🎯 JEE 2026 Mock Test Portal

A full-featured JEE mock exam website with 90 questions, timer, result analysis, and email reporting — **completely free to host on GitHub Pages**.

---

## 📁 File Structure

```
jee2026/
├── index.html       ← Main website
├── style.css        ← All styles
├── questions.js     ← 90 JEE questions (Physics, Chemistry, Math)
├── app.js           ← Exam logic, timer, results, email
└── README.md        ← This file
```

---

## 🚀 Host on GitHub Pages (Free)

### Step 1: Create GitHub repository
1. Go to [github.com](https://github.com) → **New Repository**
2. Name it: `jee2026-mock-test` (or anything you like)
3. Set it to **Public**
4. Click **Create repository**

### Step 2: Upload files
1. Click **Add file** → **Upload files**
2. Upload all 4 files: `index.html`, `style.css`, `questions.js`, `app.js`
3. Click **Commit changes**

### Step 3: Enable GitHub Pages
1. Go to **Settings** → **Pages**
2. Under **Source**: Select `main` branch, folder `/` (root)
3. Click **Save**
4. Your site will be live at: `https://yourusername.github.io/jee2026-mock-test`

---

## 📧 Set Up Free Email Reports (EmailJS)

EmailJS lets you send emails from JavaScript — **completely free** (up to 200 emails/month).

### Step 1: Create EmailJS account
1. Go to [emailjs.com](https://emailjs.com) → Sign Up (free)

### Step 2: Add Email Service
1. Dashboard → **Email Services** → **Add New Service**
2. Choose **Gmail** (easiest)
3. Connect your Gmail account
4. Copy your **Service ID** (e.g., `service_abc123`)

### Step 3: Create Email Template
1. Dashboard → **Email Templates** → **Create New Template**
2. Use this template content:

**Subject:** JEE Mock Test Result — {{student_name}}

**Body:**
```
JEE 2026 Mock Test Result
==========================
Student: {{student_name}}
Date: {{date}}

SCORE: {{score}} ({{percentage}})
Correct: {{correct}} | Wrong: {{wrong}} | Skipped: {{skipped}}

Physics:   {{physics_score}}
Chemistry: {{chemistry_score}}
Math:      {{math_score}}

DETAILED ANSWERS:
{{details}}
```

3. Copy your **Template ID** (e.g., `template_xyz789`)

### Step 4: Get your Public Key
1. Dashboard → **Account** → **General** → Copy **Public Key**

### Step 5: Update app.js
Open `app.js` and replace in the `CONFIG` object:

```javascript
const CONFIG = {
  EMAILJS_PUBLIC_KEY:  "your_actual_public_key",
  EMAILJS_SERVICE_ID:  "service_abc123",
  EMAILJS_TEMPLATE_ID: "template_xyz789",
  ADMIN_EMAIL: "your-admin@gmail.com",   // Always receives reports
  ...
};
```

---

## ⌨️ Keyboard Shortcuts (during exam)

| Key | Action |
|-----|--------|
| `→` or `N` | Next question |
| `←` or `P` | Previous question |
| `1/2/3/4` | Select option A/B/C/D |
| `M` | Mark for review |
| `Esc` | Close modal |

---

## 📊 Features

- ✅ 90 High-quality JEE questions (30 Physics + 30 Chemistry + 30 Math)
- ✅ 3-hour countdown timer with warning at 10 minutes
- ✅ Question palette (answered/visited/marked/not-visited)
- ✅ Subject-wise switching (Physics / Chemistry / Math)
- ✅ Mark for review feature
- ✅ Detailed result with subject-wise breakdown
- ✅ Per-question solution with explanation
- ✅ Filter solutions by: All / Correct / Wrong / Skipped / Subject
- ✅ Email report to admin (auto) + student (on request)
- ✅ Keyboard shortcuts
- ✅ Mobile responsive
- ✅ GitHub Pages compatible (no backend needed)

---

## 🔧 Add More Questions

In `questions.js`, add objects to the `QUESTIONS` array following this format:

```javascript
{
  id: 91,
  subject: "physics",   // "physics" | "chemistry" | "math"
  topic: "Wave Optics",
  question: "Your question text here...",
  options: ["Option A", "Option B", "Option C", "Option D"],
  correct: 0,            // 0=A, 1=B, 2=C, 3=D
  explanation: "Detailed explanation here..."
}
```

---

## 📝 Marking Scheme

| Response | Marks |
|---------|-------|
| Correct | +4 |
| Wrong | −1 |
| Skipped | 0 |
| Maximum | 360 |

---

Built for JEE 2026 aspirants. Good luck! 🚀
