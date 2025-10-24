# ⚡ Role-Based Access Control - Quick Reference

## 🎯 Two Account Types

| Role | Upload Videos | See Hire Button | Can Hire |
|------|--------------|----------------|----------|
| **Freelancer** | ✅ Yes | ❌ No | ❌ No |
| **Employer** | ❌ No | ✅ Yes | ✅ Yes |

---

## 🔐 Security Layers

### **1. Signup (Role Selection)**
```typescript
// src/pages/Auth.tsx
<button onClick={() => setRole('freelancer')}>
  I'm a Freelancer
</button>
<button onClick={() => setRole('employer')}>
  I'm an Employer
</button>
```

### **2. Frontend (Hire Button)**
```typescript
// src/components/feed/OptimizedVideoCard.tsx
const shouldShowHireButton = useMemo(() => 
  isCurrentUserEmployer && !isVideoFromEmployer && user?.id !== video.user.id,
  [isCurrentUserEmployer, isVideoFromEmployer, user?.id, video.user.id]
);

{shouldShowHireButton && <Button>Hire</Button>}
```

### **3. Backend (RLS Policies)**
```sql
-- Only freelancers can upload
CREATE POLICY "videos_insert_policy"
ON videos FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'freelancer'
  )
);
```

---

## 📋 Implementation Checklist

- [x] ✅ Role selection in Auth.tsx
- [x] ✅ Role stored in auth metadata
- [x] ✅ Role stored in profile table
- [x] ✅ Hire button hidden for freelancers
- [x] ✅ Hire button visible for employers
- [x] ✅ RLS policies enforce upload restrictions
- [x] ✅ Performance optimized with useMemo
- [x] ✅ HireModal created for employer actions

---

## 🧪 Quick Tests

### **Freelancer Test**
```bash
1. Sign up as Freelancer
2. Check feed - No hire buttons ✅
3. Upload video - Works ✅
```

### **Employer Test**
```bash
1. Sign up as Employer
2. Check feed - Hire buttons visible ✅
3. Click hire - Modal opens ✅
4. Try upload - Fails ✅
```

---

## 📁 Key Files

| File | What It Does |
|------|-------------|
| `src/pages/Auth.tsx` | Role selection |
| `src/components/feed/OptimizedVideoCard.tsx` | Hire button logic |
| `src/components/hire/HireModal.tsx` | Hire interface |
| `supabase/migrations/*.sql` | Database security |

---

## 🚀 How to Use

### **Check User Role:**
```typescript
import { getProfileRole } from '@/hooks/useAuth';
const role = getProfileRole(profile);
if (role === 'employer') {
  // Show employer features
}
```

### **Render Based on Role:**
```typescript
const isEmployer = useMemo(() => 
  getProfileRole(profile) === 'employer',
  [profile]
);

{isEmployer && <HireButton />}
```

### **Database Helper:**
```sql
SELECT is_freelancer(auth.uid()); -- Returns boolean
SELECT is_employer(auth.uid());   -- Returns boolean
```

---

## ✅ Summary

**System Features:**
- 🔒 **Secure:** Multi-layer access control
- ⚡ **Fast:** Optimized with memoization
- 🎨 **Clean:** Hidden buttons, not just disabled
- 💪 **Robust:** Backend enforcement via RLS

**Result:** Freelancers showcase skills, Employers hire talent!
