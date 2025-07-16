// --- UPDATED FIREBASE IMPORTS (v10.12.2) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  Timestamp,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"

// --- CORRECTED FIREBASE CONFIG (Reverted to original values) ---
const firebaseConfig = {
  apiKey: "AIzaSyBv4duy17y72b22VtBxisXztEylSFuK1jU",
  authDomain: "gilfinnasnew.firebaseapp.com",
  projectId: "gilfinnasnew",
  storageBucket: "gilfinnasnew.firebasestorage.app", // Reverted to original
  messagingSenderId: "53159078238",
  appId: "1:53159078238:web:bcb62c2c14fb5faa2907cf",
  measurementId: "G-JDEW3WD82Q",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const months = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
]

// --- Default categories structure for new users ---
// 'fixed: true' is used for UI rendering in the main table, but all rows are editable/deletable in the settings modal.
const defaultCategories = {
  הכנסות: {
    color: "header-income",
    hex: "#10b981", // Updated hex for dark theme
    items: {
      sales_cash: { name: "מכירות (מזומן/אפליקציה)", type: "income", fixed: true },
      sales_credit: { name: "מכירות (אשראי)", type: "income", fixed: true },
      sales_cheques: { name: "שיקים", type: "income", fixed: true },
      sales_transfer: { name: "מכירות (העברה בנקאית)", type: "income", fixed: true },
      sales_other: { name: "הכנסות נוספות", type: "income", fixed: true },
    },
  },
  "הכנסות פטורות ממע'מ": {
    color: "header-income",
    hex: "#10b981", // Updated hex for dark theme
    items: {
      exempt_sales_cash: { name: "מכירות פטורות (מזומן/אפליקציה)", type: "exempt_income", fixed: true },
      exempt_sales_credit: { name: "מכירות פטורות (אשראי)", type: "exempt_income", fixed: true },
      exempt_sales_cheques: { name: "שיקים פטורים", type: "exempt_income", fixed: true },
      exempt_sales_transfer: { name: "מכירות פטורות (העברה בנקאית)", type: "exempt_income", fixed: true },
      exempt_sales_other: { name: "הכנסות פטורות נוספות", type: "exempt_income", fixed: true },
    },
    hidden: true,
  },
  ספקים: {
    color: "header-suppliers",
    hex: "#f59e0b", // Updated hex for dark theme
    items: {
      supplier_1: { name: "", type: "expense", placeholder: "ספק 1" },
      supplier_2: { name: "", type: "expense", placeholder: "ספק 2" },
      supplier_3: { name: "", type: "expense", placeholder: "ספק 3" },
      supplier_4: { name: "", type: "expense", placeholder: "ספק 4" },
      supplier_5: { name: "", type: "expense", placeholder: "ספק 5" },
      supplier_6: { name: "", type: "expense", placeholder: "ספק 6" },
      supplier_7: { name: "", type: "expense", placeholder: "ספק 7" },
      supplier_8: { name: "", type: "expense", placeholder: "ספק 8" },
      supplier_9: { name: "", type: "expense", placeholder: "ספק 9" },
      supplier_10: { name: "", type: "expense", placeholder: "ספק 10" },
    },
  },
  "הוצאות משתנות": {
    color: "header-expense-var",
    hex: "#ef4444", // Updated hex for dark theme
    items: {
      electricity: { name: "חשמל", type: "expense", fixed: true },
      water: { name: "מים", type: "expense", fixed: true },
      packaging: { name: "אריזות וחומרים מתכלים", type: "expense", fixed: true },
      marketing: { name: "שיווק ופרסום", type: "expense", fixed: true },
      custom_var_1: { name: "", type: "expense", placeholder: "הוצאה משתנה 1" },
      custom_var_2: { name: "", type: "expense", placeholder: "הוצאה משתנה 2" },
      custom_var_3: { name: "", type: "expense", placeholder: "הוצאה משתנה 3" },
      custom_var_4: { name: "", type: "expense", placeholder: "הוצאה משתנה 4" },
    },
  },
  "הוצאות עם הכרה חלקית במע'מ": {
    color: "header-expense-var",
    hex: "#ef4444", // Updated hex for dark theme
    items: {
      car_expenses: { name: "הוצאות רכב", type: "partial_vat_expense", vatRate: 0.67, fixed: true },
      phone_expenses: { name: "טלפון נייד", type: "partial_vat_expense", vatRate: 0.5, fixed: true },
      partial_custom_1: { name: "", type: "partial_vat_expense", vatRate: 0.67, placeholder: "הוצאה עם הכרה חלקית 1" },
      partial_custom_2: { name: "", type: "partial_vat_expense", vatRate: 0.67, placeholder: "הוצאה עם הכרה חלקית 2" },
    },
  },
  הלוואות: {
    color: "header-loans",
    hex: "#0ea5e9", // Updated hex for dark theme
    items: {
      loan_1: { name: "", type: "expense_no_vat", placeholder: "שם הלוואה 1" },
      loan_2: { name: "", type: "expense_no_vat", placeholder: "שם הלוואה 2" },
      loan_3: { name: "", type: "expense_no_vat", placeholder: "שם הלוואה 3" },
      loan_4: { name: "", type: "expense_no_vat", placeholder: "שם הלוואה 4" },
      loan_5: { name: "", type: "expense_no_vat", placeholder: "שם הלוואה 5" },
      loan_6: { name: "", type: "expense_no_vat", placeholder: "שם הלוואה 6" },
      loan_7: { name: "", type: "expense_no_vat", placeholder: "שם הלוואה 7" },
      loan_8: { name: "", type: "expense_no_vat", placeholder: "שם הלוואה 8" },
      loan_9: { name: "", type: "expense_no_vat", placeholder: "שם הלוואה 9" },
      loan_10: { name: "", type: "expense_no_vat", placeholder: "שם הלוואה 10" },
    },
  },
  "הוצאות קבועות": {
    color: "header-expense-fixed",
    hex: "#8b5cf6", // Updated hex for dark theme
    items: {
      rent: { name: "שכירות", type: "expense", fixed: true },
      arnona: { name: "ארנונה", type: "expense", fixed: true },
      salaries: { name: "משכורות", type: "employee_cost", fixed: true },
      insurance: { name: "ביטוחים", type: "expense", fixed: true },
      accounting: { name: "הנהלת חשבונות", type: "expense", fixed: true },
      communication: { name: "תקשורת ואינטרנט", type: "expense", fixed: true },
      software: { name: "רישיונות ותוכנה", type: "expense", fixed: true },
      owner_withdrawal: {
        name: "משיכת בעלים (עוסק מורשה/פטור)",
        type: "expense_no_vat",
        fixed: true,
        businessTypes: ["authorized", "exempt"],
      },
      controlling_salary: {
        name: 'שכר בעלי שליטה (חברה בע"מ)',
        type: "employee_cost",
        fixed: true,
        businessTypes: ["company"],
      },
      dividend_withdrawal: {
        name: 'משיכת דיבידנד (חברה בע"מ)',
        type: "expense_no_vat",
        fixed: true,
        businessTypes: ["company"],
      },
      custom_fixed_1: { name: "", type: "expense", placeholder: "הוצאה קבועה 1" },
      custom_fixed_2: { name: "", type: "expense", placeholder: "הוצאה קבועה 2" },
      custom_fixed_3: { name: "", type: "expense", placeholder: "הוצאה קבועה 3" },
      custom_fixed_4: { name: "", type: "expense", placeholder: "הוצאה קבועה 4" },
    },
  },
  "תשלומים ומיסים": {
    color: "header-taxes",
    hex: "#6366f1", // Updated hex for dark theme
    items: {
      social_security: { name: "מקדמות ביטוח לאומי", type: "employee_cost", fixed: true },
      income_tax: { name: "מקדמות מס הכנסה", type: "expense", fixed: true },
      vat_payment: { name: 'תשלום מע"מ מחודש קודם', type: "expense_calculated", fixed: true },
      vat_field: { name: 'מע"מ (חישוב)', type: "expense_calculated", fixed: true },
      custom_tax_1: { name: "", type: "expense", placeholder: "מס נוסף 1" },
      custom_tax_2: { name: "", type: "expense", placeholder: "מס נוסף 2" },
      custom_tax_3: { name: "", type: "expense", placeholder: "מס נוסף 3" },
      custom_tax_4: { name: "", type: "expense", placeholder: "מס נוסף 4" },
    },
    vatRelated: true,
  },
  "הוצאות בלתי צפויות": {
    color: "header-unexpected",
    hex: "#64748b", // Updated hex for dark theme
    items: { misc: { name: 'שונות / בלת"מ', type: "expense", fixed: true } },
  },
}

// Global variables for system data
let userCategories = {} // Will contain user-specific categories after loading from DB
let cashflowData = {}
let currentUser = null
let currentYear = new Date().getFullYear()
let currentMonthIndex = new Date().getMonth()
let selectedDay = new Date().getDate() - 1
let recaptchaVerifier = null
let confirmationResult = null
let updateTimeout = null
let dbListenerUnsubscribe = null // Firestore listener unsubscribe function

// DOM elements
const loader = document.getElementById("loader")
const authContainer = document.getElementById("auth-container")
const appContainer = document.getElementById("app-container")
const authForm = document.getElementById("auth-form")
const authTitle = document.getElementById("auth-title")
const authMessage = document.getElementById("auth-message")
const logoutBtn = document.getElementById("logout-btn")
const settingsBtn = document.getElementById("settings-btn")
const settingsModal = document.getElementById("settings-modal")
const closeSettingsBtn = document.getElementById("close-settings")
const forgotPasswordLink = document.getElementById("forgot-password-link")
const toggleAuthModeLink = document.getElementById("toggle-auth-mode")
const changePasswordBtn = document.getElementById("change-password-btn")
const subscriptionModal = document.getElementById("subscription-modal")
const logoutFromExpiredBtn = document.getElementById("logout-from-expired")
const upgradeNowBtn = document.getElementById("upgrade-now-btn")
const subscriptionBanner = document.getElementById("subscription-banner")
const bannerText = document.getElementById("banner-text")
const bannerButton = document.getElementById("banner-button")
const vatSetupModal = document.getElementById("vat-setup-modal")
const supportButton = document.getElementById("supportButton")
const authSubmitBtn = document.getElementById("auth-submit-btn")
const termsContainer = document.getElementById("terms-container")
const termsCheckbox = document.getElementById("terms-checkbox")
const autoSaveCheckbox = document.getElementById("auto-save-checkbox")
const autoAlertsCheckbox = document.getElementById("auto-alerts-checkbox")

const customAlertModal = document.getElementById("custom-alert-modal")
const customAlertBody = document.getElementById("custom-alert-body")
const customAlertOkBtn = document.getElementById("custom-alert-ok-btn")

const customConfirmModal = document.getElementById("custom-confirm-modal")
const customConfirmBody = document.getElementById("custom-confirm-body")
const customConfirmOkBtn = document.getElementById("custom-confirm-ok-btn")
const customConfirmCancelBtn = document.getElementById("custom-confirm-cancel-btn")

const phoneNumberInput = document.getElementById("phone-number")
const sendVerificationBtn = document.getElementById("send-verification-code")
const verificationCodeArea = document.getElementById("verification-code-area")
const verificationCodeInput = document.getElementById("verification-code")
const verifyPhoneBtn = document.getElementById("verify-phone")
const remove2faBtn = document.getElementById("remove-2fa")
const phoneNumberDisplay = document.getElementById("phone-number-display")
const verifiedPhoneSpan = document.getElementById("verified-phone")

const prevYearBtn = document.getElementById("prev-year-btn")
const nextYearBtn = document.getElementById("next-year-btn")
const currentYearDisplay = document.getElementById("current-year-display")

const aiChatButton = document.getElementById("ai-chat-button")
const aiChatWidget = document.getElementById("ai-chat-widget")
const chatCloseBtn = document.getElementById("chat-close-btn")
const chatMessages = document.getElementById("chat-messages")
const chatForm = document.getElementById("chat-form")
const chatInput = document.getElementById("chat-input")
const chatSendBtn = document.getElementById("chat-send-btn")
const chatHistory = []

// NEW: Category Editor Elements
const editCategoriesBtn = document.getElementById("edit-categories-btn")
const categoryEditorModal = document.getElementById("category-editor-modal")
const categoryEditorContainer = document.getElementById("category-editor-container")
const saveCategoryChangesBtn = document.getElementById("save-category-changes")
const cancelCategoryEditBtn = document.getElementById("cancel-category-edit")

// NEW: Fullscreen elements
const toggleFullscreenBtn = document.getElementById('toggle-fullscreen-btn');
const mainTableContainer = document.querySelector('.main-table-container');
const expandIcon = document.getElementById('expand-icon');
const collapseIcon = document.getElementById('collapse-icon');

// NEW: Theme Toggle Elements
const themeToggleBtn = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

// Function to show custom alert
function showCustomAlert(message) {
  customAlertBody.innerHTML = message
  customAlertModal.classList.remove("hidden")
  customAlertOkBtn.onclick = () => {
    customAlertModal.classList.add("hidden")
  }
}

// Function to show custom confirm (with OK/Cancel buttons)
function showCustomConfirm(message) {
  return new Promise((resolve) => {
    customConfirmBody.textContent = message
    customConfirmModal.classList.remove("hidden")

    const okHandler = () => {
      customConfirmModal.classList.add("hidden")
      cleanup()
      resolve(true)
    }

    const cancelHandler = () => {
      customConfirmModal.classList.add("hidden")
      cleanup()
      resolve(false)
    }

    const cleanup = () => {
      customConfirmOkBtn.removeEventListener("click", okHandler)
      customConfirmCancelBtn.removeEventListener("click", cancelHandler)
    }

    customConfirmOkBtn.addEventListener("click", okHandler, { once: true })
    customConfirmCancelBtn.addEventListener("click", cancelHandler, { once: true })
  })
}

// Logic for the support button that appears and disappears on scroll
let lastScrollTop = 0
let scrollTimeout

window.addEventListener("scroll", () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop

  supportButton.classList.add("hidden-on-scroll")

  clearTimeout(scrollTimeout)

  scrollTimeout = setTimeout(() => {
    supportButton.classList.remove("hidden-on-scroll")
  }, 1000)

  lastScrollTop = scrollTop
})

// Scroll functions for the table (for use with arrow buttons)
window.scrollTable = (direction) => {
  const container = document.getElementById("table-container")
  if (!container) return

  const scrollAmount = 100
  switch (direction) {
    case "up":
      container.scrollTop -= scrollAmount
      break
    case "down":
      container.scrollTop += scrollAmount
      break
    case "left":
      container.scrollLeft -= scrollAmount
      break
    case "right":
      container.scrollLeft += scrollAmount
      break
  }
}

// Event listeners for subscription banner buttons
bannerButton.addEventListener("click", () => {
  window.open("offer.html", "_blank")
})

upgradeNowBtn.addEventListener("click", () => {
  window.open("offer.html", "_blank")
})

// Save VAT settings
document.getElementById("save-vat-settings").addEventListener("click", async () => {
  const businessType = document.getElementById("business-type").value
  const frequency = document.getElementById("vat-frequency").value
  const paymentDay = Number.parseInt(document.getElementById("vat-payment-day").value)
  const hasExemptIncome = document.getElementById("has-exempt-income").value === "yes"

  if (!currentUser) return

  try {
    const docRef = doc(db, "users", currentUser.uid)
    await updateDoc(docRef, {
      vatSettings: {
        businessType: businessType,
        frequency: frequency,
        paymentDay: paymentDay,
        hasExemptIncome: hasExemptIncome,
      },
    })

    cashflowData.vatSettings = { businessType, frequency, paymentDay, hasExemptIncome }
    vatSetupModal.classList.add("hidden")
    showToast('הגדרות מע"מ ועסק נשמרו בהצלחה!')
    renderApp()
  } catch (error) {
    console.error("Error saving VAT settings:", error)
    showToast('שגיאה בשמירת הגדרות מע"מ')
  }
})

// Open VAT settings modal from main settings modal
document.getElementById("edit-vat-settings").addEventListener("click", () => {
  if (cashflowData.vatSettings) {
    document.getElementById("business-type").value = cashflowData.vatSettings.businessType || "company"
    document.getElementById("vat-frequency").value = cashflowData.vatSettings.frequency || "monthly"
    document.getElementById("vat-payment-day").value = cashflowData.vatSettings.paymentDay || 15
    document.getElementById("has-exempt-income").value = cashflowData.vatSettings.hasExemptIncome ? "yes" : "no"
  }
  settingsModal.classList.add("hidden") // Close main settings modal
  vatSetupModal.classList.remove("hidden") // Open VAT settings modal
})

// Listen for user authentication state changes (Firebase Auth)
onAuthStateChanged(auth, (user) => {
  // Unsubscribe from previous DB listener to prevent duplicates
  if (dbListenerUnsubscribe) {
    dbListenerUnsubscribe()
  }

  if (user) {
    currentUser = user

    // Set up dashboard button
    const dashboardBtn = document.getElementById("dashboard-btn")
    if (dashboardBtn) {
      dashboardBtn.addEventListener("click", () => {
        if (currentUser && currentUser.uid) {
          const dashboardUrl = `https://dashboard-frontend-five-azure.vercel.app?userId=${currentUser.uid}`
          window.open(dashboardUrl, "_blank")
        } else {
          showCustomAlert("עליך להיות מחובר כדי לגשת לדשבורד.")
        }
      })
    }

    const docRef = doc(db, "users", currentUser.uid)

    // Real-time listener for user data in Firestore
    dbListenerUnsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        loader.classList.remove("hidden")
        try {
          const userData = docSnap.exists() ? docSnap.data() : null

          // If no user data or no subscription end date, create default data (including categories)
          if (!userData || !userData.subscriptionEndDate) {
            const trialEndDate = new Date()
            trialEndDate.setDate(trialEndDate.getDate() + 14)

            const initialData = {
              clientName: userData?.clientName || user.email,
              openingBalance: userData?.openingBalance || 10000,
              years: userData?.years || {},
              settings: { autoSave: false, autoAlerts: true },
              subscriptionEndDate: Timestamp.fromDate(trialEndDate),
              subscriptionType: "trial",
              transactions: [],
              categories: defaultCategories, // Save default categories for new users
            }

            await setDoc(docRef, initialData, { merge: true })
            showToast("ברוכים הבאים! קיבלת 14 ימי ניסיון חינם 🎉")
            setTimeout(() => {
              vatSetupModal.classList.remove("hidden")
            }, 1500)
            return
          }

          // FIX: for existing users missing 'transactions' or 'categories' fields
          if (docSnap.exists()) {
            const updates = {}
            if (!userData.hasOwnProperty("transactions")) {
              updates.transactions = []
            }
            // If user has no categories defined, load defaults
            if (!userData.hasOwnProperty("categories") || Object.keys(userData.categories).length === 0) {
              updates.categories = defaultCategories
            }

            if (Object.keys(updates).length > 0) {
              console.log("Existing user is missing fields. Updating document...")
              await updateDoc(docRef, updates)
              // The listener will re-trigger with updated data, so we wait.
              return
            }
          }

          // FIX for missing properties on existing users' categories
          // This ensures that users who registered before certain properties (like businessTypes) were added
          // get those properties merged into their category data without losing custom names.
          if (userData.categories) {
              const userCats = userData.categories;
              let needsUpdate = false;
              Object.keys(defaultCategories).forEach(groupName => {
                  if (userCats[groupName] && defaultCategories[groupName]) {
                      Object.keys(defaultCategories[groupName].items).forEach(itemKey => {
                          const defaultItem = defaultCategories[groupName].items[itemKey];
                          if (userCats[groupName].items[itemKey]) {
                              const userItem = userCats[groupName].items[itemKey];
                              // Check for and add missing properties from the default item
                              Object.keys(defaultItem).forEach(prop => {
                                  if (!userItem.hasOwnProperty(prop)) {
                                      userItem[prop] = defaultItem[prop];
                                      needsUpdate = true;
                                  }
                              });
                          }
                      });
                  }
              });

              // If we patched the categories, we should save the updated structure back to Firestore
              if (needsUpdate) {
                  console.log("Patching user categories with new properties...");
                  await updateDoc(docRef, { categories: userCats });
                  // The listener will re-trigger with the updated data, so we can just return here.
                  return;
              }
          }

          // Load user-specific categories or default categories, ensure correct order
          userCategories = userData.categories || defaultCategories
          // Ensure category order always matches default order
          const orderedUserCategories = {}
          Object.keys(defaultCategories).forEach((groupName) => {
            if (userCategories[groupName]) {
              orderedUserCategories[groupName] = { ...userCategories[groupName] }
              // Also ensure order of items within each group
              const orderedItems = {}
              Object.keys(defaultCategories[groupName].items).forEach((itemKey) => {
                if (userCategories[groupName].items[itemKey]) {
                  orderedItems[itemKey] = userCategories[groupName].items[itemKey]
                }
              })
              // Add new items added by user at the end
              Object.keys(userCategories[groupName].items).forEach((itemKey) => {
                if (!orderedItems.hasOwnProperty(itemKey)) {
                  orderedItems[itemKey] = userCategories[groupName].items[itemKey]
                }
              })
              orderedUserCategories[groupName].items = orderedItems
            }
          })
          // Add new groups added by user (if any, though not expected)
          Object.keys(userCategories).forEach((groupName) => {
            if (!orderedUserCategories.hasOwnProperty(groupName)) {
              orderedUserCategories[groupName] = userCategories[groupName]
            }
          })
          userCategories = orderedUserCategories

          // Check subscription validity
          if (userData.subscriptionEndDate.toDate() > new Date()) {
            await loadData(userData)
            authContainer.classList.add("hidden")
            appContainer.classList.remove("hidden")
            updateSubscriptionBanner(userData)

            // Show VAT settings modal if not yet configured
            if (!userData.vatSettings) {
              setTimeout(() => {
                vatSetupModal.classList.remove("hidden")
              }, 1000)
            }

            // Show 2FA details if configured
            if (userData.phoneNumber) {
              phoneNumberDisplay.classList.remove("hidden")
              verifiedPhoneSpan.textContent = userData.phoneNumber
              remove2faBtn.classList.remove("hidden")
              phoneNumberInput.value = userData.phoneNumber
            }
            // Update settings checkboxes
            autoSaveCheckbox.checked = userData.settings?.autoSave || false
            autoAlertsCheckbox.checked = userData.settings?.autoAlerts ?? true
          } else {
            // If subscription expired, show expired subscription modal
            appContainer.classList.add("hidden")
            subscriptionModal.classList.remove("hidden")
          }
        } catch (error) {
          console.error("Error processing data snapshot:", error)
          showToast("שגיאה בעיבוד הנתונים")
        } finally {
          loader.classList.add("hidden")
        }
      },
      (error) => {
        console.error("Error with real-time listener:", error)
        showToast("שגיאה בחיבור לשרת. נסה לרענן את הדף.")
        loader.classList.add("hidden")
      },
    )
  } else {
    // If user is not logged in, show login screen
    currentUser = null
    userCategories = {} // Clear categories on logout
    authContainer.classList.remove("hidden")
    appContainer.classList.add("hidden")
    subscriptionModal.classList.add("hidden")
    subscriptionBanner.classList.add("hidden")
    loader.classList.add("hidden")
  }
})

// Update subscription banner (trial days / active subscription)
function updateSubscriptionBanner(userData) {
  const now = new Date()
  const endDate = userData.subscriptionEndDate.toDate()
  const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))

  if (userData.subscriptionType === "trial" && daysLeft > 0) {
    subscriptionBanner.className = "subscription-banner trial"
    bannerText.textContent = `נשארו לך ${daysLeft} ימי ניסיון`
    bannerButton.textContent = "לשדרוג לחץ כאן"
    subscriptionBanner.classList.remove("hidden")
  } else if (userData.subscriptionType !== "trial") {
    subscriptionBanner.className = "subscription-banner active"
    bannerText.textContent = `מנוי פעיל: ${userData.subscriptionPlan || "עסק קטן"} (עד ${endDate.toLocaleDateString("he-IL")})`
    bannerButton.style.display = "none"
    subscriptionBanner.classList.remove("hidden")
  } else {
    subscriptionBanner.classList.add("hidden")
  }
}

// Handle login/signup/password reset form
authForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const mode = authForm.dataset.mode || "login"

  loader.classList.remove("hidden")
  authMessage.classList.add("hidden")
  authMessage.className = "bg-red-800/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-4 hidden" // Reset to error style

  try {
    if (mode === "login") {
      await signInWithEmailAndPassword(auth, email, password)
    } else if (mode === "signup") {
      if (!termsCheckbox.checked) {
        showToast("יש לאשר את תנאי השימוש ומדיניות הפרטיות.")
        loader.classList.add("hidden") // Hide loader if terms not checked
        return
      }
      await createUserWithEmailAndPassword(auth, email, password)
      showToast("נרשמת בהצלחה! קיבלת 14 ימי ניסיון חינם 🎉")
    } else if (mode === "resetPassword") {
      await sendPasswordResetEmail(auth, email)
      authMessage.textContent = "נשלח אליך מייל לאיפוס סיסמה."
      authMessage.classList.remove("hidden")
      authMessage.classList.replace("bg-red-800/30", "bg-blue-800/30") // Change to info style
      authMessage.classList.replace("border-red-700", "border-blue-700")
      authMessage.classList.replace("text-red-300", "text-blue-300")
      switchToLoginMode()
    }
  } catch (error) {
    console.error("Auth error:", error)
    authMessage.textContent = getFriendlyAuthError(error.code)
    authMessage.classList.remove("hidden")
    // Ensure it's red for errors
    authMessage.classList.replace("bg-blue-800/30", "bg-red-800/30")
    authMessage.classList.replace("border-blue-700", "border-red-700")
    authMessage.classList.replace("text-blue-300", "text-red-300")
  } finally {
    if (!auth.currentUser) {
      loader.classList.add("hidden")
    }
  }
})

// Switch to signup mode
toggleAuthModeLink.addEventListener("click", (e) => {
  e.preventDefault()
  switchToSignupMode()
})

// Switch to password reset mode
forgotPasswordLink.addEventListener("click", (e) => {
  e.preventDefault()
  switchToResetMode()
})

// Functions to switch between form modes (signup, login, reset)
function switchToSignupMode() {
  authForm.dataset.mode = "signup"
  authTitle.textContent = "הרשמה"
  document.getElementById("password").classList.remove("hidden")
  authSubmitBtn.textContent = "הירשם"
  forgotPasswordLink.textContent = "חזור להתחברות"
  toggleAuthModeLink.classList.add("hidden")
  forgotPasswordLink.onclick = (e) => {
    e.preventDefault()
    switchToLoginMode()
  }

  termsContainer.classList.remove("hidden")
  termsCheckbox.checked = false
  authSubmitBtn.disabled = true
  authSubmitBtn.classList.add("opacity-50", "cursor-not-allowed")
}

function switchToResetMode() {
  authForm.dataset.mode = "resetPassword"
  authTitle.textContent = "איפוס סיסמה"
  document.getElementById("password").classList.add("hidden")
  authSubmitBtn.textContent = "שלח קישור לאיפוס"
  forgotPasswordLink.textContent = "חזור להתחברות"
  toggleAuthModeLink.classList.remove("hidden")
  forgotPasswordLink.onclick = (e) => {
    e.preventDefault()
    switchToLoginMode()
  }

  termsContainer.classList.add("hidden")
  authSubmitBtn.disabled = false
  authSubmitBtn.classList.remove("opacity-50", "cursor-not-allowed")
}

function switchToLoginMode() {
  authForm.dataset.mode = "login"
  authTitle.textContent = "התחברות"
  document.getElementById("password").classList.remove("hidden")
  authSubmitBtn.textContent = "התחבר"
  forgotPasswordLink.textContent = "שכחת סיסמה?"
  toggleAuthModeLink.classList.remove("hidden")
  forgotPasswordLink.onclick = (e) => {
    e.preventDefault()
    switchToResetMode()
  }

  termsContainer.classList.add("hidden")
  authSubmitBtn.disabled = false
  authSubmitBtn.classList.remove("opacity-50", "cursor-not-allowed")
}

// Handle terms and conditions checkbox
termsCheckbox.addEventListener("change", () => {
  if (authForm.dataset.mode === "signup") {
    if (termsCheckbox.checked) {
      authSubmitBtn.disabled = false
      authSubmitBtn.classList.remove("opacity-50", "cursor-not-allowed")
    } else {
      authSubmitBtn.disabled = true
      authSubmitBtn.classList.add("opacity-50", "cursor-not-allowed")
    }
  }
})

// Logout buttons
logoutBtn.addEventListener("click", () => signOut(auth))
logoutFromExpiredBtn.addEventListener("click", () => signOut(auth))

// Function to show user-friendly authentication error messages
function getFriendlyAuthError(code) {
  switch (code) {
    case "auth/invalid-login-credentials":
      return "פרטי ההתחברות שגויים. אנא בדוק את האימייל והסיסמה."
    case "auth/wrong-password":
      return "הסיסמה שהזנת שגויה."
    case "auth/user-not-found":
      return "לא נמצא משתמש עם כתובת אימייל זו."
    case "auth/email-already-in-use":
      return "כתובת אימייל זו כבר רשומה במערכת."
    case "auth/weak-password":
      return "הסיסמה חלשה מדי. אנא בחר סיסמה עם 6 תווים לפחות."
    case "auth/too-many-requests":
      return "יותר מדי ניסיונות. נסה שוב מאוחר יותר."
    case "auth/invalid-phone-number":
      return "מספר הטלפון לא תקין."
    case "auth/invalid-verification-code":
      return "קוד האימות שגוי."
    case "auth/api-key-not-valid-in-this-project":
      return "אירעה שגיאת תצורה. אנא פנה לתמיכה."
    default:
      return "אירעה שגיאה. אנא נסה שוב."
  }
}

// Open settings modal
settingsBtn.addEventListener("click", () => {
  settingsModal.classList.remove("hidden")
})

// Close settings modal
closeSettingsBtn.addEventListener("click", () => settingsModal.classList.add("hidden"))

// Change password
changePasswordBtn.addEventListener("click", async () => {
  const newPassword = document.getElementById("new-password").value
  const confirmPassword = document.getElementById("confirm-password").value

  if (newPassword.length < 6) {
    showToast("הסיסמה חייבת להכיל לפחות 6 תווים.")
    return
  }
  if (newPassword !== confirmPassword) {
    showToast("הסיסמאות אינן תואמות.")
    return
  }

  try {
    await updatePassword(auth.currentUser, newPassword)
    showToast("הסיסמה שונתה בהצלחה!")
    settingsModal.classList.add("hidden")
    document.getElementById("new-password").value = ""
    document.getElementById("confirm-password").value = ""
  } catch (error) {
    console.error("Error changing password:", error)
    showToast("שגיאה בשינוי הסיסמה. ייתכן שתצטרך להתחבר מחדש.")
  }
})

// Handle Recaptcha and 2FA
sendVerificationBtn.addEventListener("click", async () => {
  const phoneNumber = phoneNumberInput.value.trim()
  if (!phoneNumber) {
    showToast("אנא הזן מספר טלפון")
    return
  }

  try {
    // Clear recaptcha container before re-creating
    document.getElementById("recaptcha-container").innerHTML = ""

    // Initialize RecaptchaVerifier only if it doesn't exist
    if (!recaptchaVerifier) {
      recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "normal",
        callback: async (response) => {
          // This callback is triggered when reCAPTCHA is successfully completed
          sendVerificationBtn.disabled = true
          sendVerificationBtn.textContent = "שולח קוד..."
          try {
            confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
            verificationCodeArea.classList.remove("hidden")
            sendVerificationBtn.textContent = "קוד נשלח"
            showToast("קוד אימות נשלח למספר הטלפון")
          } catch (error) {
            console.error("Error sending SMS:", error)
            showToast(getFriendlyAuthError(error.code))
            // Reset reCAPTCHA on error
            if (window.grecaptcha && window.recaptchaWidgetId) {
              window.grecaptcha.reset(window.recaptchaWidgetId)
            }
            sendVerificationBtn.disabled = false
            sendVerificationBtn.textContent = "שלח קוד אימות"
          }
        },
        "expired-callback": () => {
          // This callback is triggered when reCAPTCHA expires
          showToast("אימות reCAPTCHA פג, אנא נסה שוב.")
          sendVerificationBtn.disabled = false
          sendVerificationBtn.textContent = "שלח קוד אימות"
        },
      })
    }

    // Render the reCAPTCHA widget
    recaptchaVerifier.render().then((widgetId) => {
      window.recaptchaWidgetId = widgetId // Store widgetId for future resets
    })
  } catch (error) {
    console.error("Error initializing reCAPTCHA:", error)
    showToast(getFriendlyAuthError(error.code))
  }
})

// Verify phone code
verifyPhoneBtn.addEventListener("click", async () => {
  const code = verificationCodeInput.value.trim()
  if (!code || code.length !== 6) {
    showToast("אנא הזן קוד אימות בן 6 ספרות")
    return
  }

  try {
    const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, code)
    await linkWithCredential(auth.currentUser, credential) // Link phone number to current user

    const docRef = doc(db, "users", currentUser.uid)
    await updateDoc(docRef, {
      phoneNumber: phoneNumberInput.value.trim(),
      twoFactorEnabled: true,
    })

    // Update UI
    phoneNumberDisplay.classList.remove("hidden")
    verifiedPhoneSpan.textContent = phoneNumberInput.value.trim()
    remove2faBtn.classList.remove("hidden")
    verificationCodeArea.classList.add("hidden")
    sendVerificationBtn.disabled = false
    sendVerificationBtn.textContent = "שלח קוד אימות"
    verificationCodeInput.value = ""

    showToast("אימות דו-שלבי הופעל בהצלחה!")
  } catch (error) {
    console.error("Error verifying phone:", error)
    showToast(getFriendlyAuthError(error.code))
  }
})

// Remove 2FA
remove2faBtn.addEventListener("click", async () => {
  const confirmed = await showCustomConfirm("האם אתה בטוח שברצונך להסיר את האימות הדו-שלבי?")
  if (!confirmed) {
    return
  }

  try {
    const docRef = doc(db, "users", currentUser.uid)
    await updateDoc(docRef, {
      phoneNumber: null,
      twoFactorEnabled: false,
    })

    // Update UI
    phoneNumberDisplay.classList.add("hidden")
    remove2faBtn.classList.add("hidden")
    phoneNumberInput.value = ""

    showToast("אימות דו-שלבי הוסר בהצלחה")
  } catch (error) {
    console.error("Error removing 2FA:", error)
    showToast("שגיאה בהסרת האימות הדו-שלבי")
  }
})

// Year navigation buttons
prevYearBtn.addEventListener("click", () => {
  currentYear--
  renderApp()
})

nextYearBtn.addEventListener("click", () => {
  currentYear++
  renderApp()
})

// Load user data from DB
async function loadData(data) {
  try {
    cashflowData = data
    loader.classList.add("hidden")
    renderApp()
  } catch (error) {
    console.error("Error loading data:", error)
    showToast("שגיאה בטעינת הנתונים")
  }
}

// Debounced save function (saves after a short delay)
let saveTimeout
const debouncedSave = () => {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(saveData, 2000)
}

// Save data to Firestore
async function saveData() {
  if (!currentUser) return
  showToast("שומר נתונים...")
  try {
    if (!cashflowData.settings) {
      cashflowData.settings = {}
    }
    cashflowData.settings.autoSave = autoSaveCheckbox.checked
    cashflowData.settings.autoAlerts = autoAlertsCheckbox.checked

    // Ensure user categories are part of the saved data
    cashflowData.categories = userCategories

    const docRef = doc(db, "users", currentUser.uid)
    await setDoc(docRef, cashflowData, { merge: true })
    showToast("הנתונים נשמרו בהצלחה!")
  } catch (error) {
    console.error("Error saving data: ", error)
    showToast("שגיאה בשמירת הנתונים.")
  }
}

// *** UPDATED: VAT rate changed to 18% as requested ***
const VAT_RATE = 0.18 // VAT rate in Israel

// Main function to render the application
function renderApp() {
  try {
    // Protection: Do not render if essential data (like categories) is not loaded
    if (!currentUser || Object.keys(userCategories).length === 0) {
      return
    }

    const openingBalanceValue = Number.parseFloat((cashflowData.openingBalance || 10000).toString().replace(/,/g, ""))
    document.getElementById("openingBalance").value = formatWithCommas(openingBalanceValue)

    const openingBalanceInput = document.getElementById("openingBalance")
    openingBalanceInput.classList.remove("opening-balance-positive", "opening-balance-negative")
    if (openingBalanceValue < 0) {
      openingBalanceInput.classList.add("opening-balance-negative")
    } else if (openingBalanceValue > 0) {
      openingBalanceInput.classList.add("opening-balance-positive")
    }

    document.getElementById("clientName").value = cashflowData.clientName || ""
    currentYearDisplay.textContent = currentYear
    // Ensure data structure exists for current year and month
    ensureDataStructure(currentYear, currentMonthIndex)
    renderMonthTabs()
    renderTableForMonth()
    renderMobileView()
    updateAllCalculations() // Run all calculations again
    const todayDateDisplay = document.getElementById("todayDateDisplay")
    if (todayDateDisplay) {
      todayDateDisplay.textContent = new Date().getDate()
    }
    document.getElementById("bankLimit").value = formatWithCommas(cashflowData.bankLimit || 0)
  } catch (error) {
    console.error("Error rendering app:", error)
    showToast("שגיאה בהצגת הנתונים")
  }
}

// Render month tabs
function renderMonthTabs() {
  try {
    const tabsContainer = document.getElementById("month-tabs")
    tabsContainer.innerHTML = ""
    months.forEach((month, index) => {
      const tab = document.createElement("button")
      tab.textContent = month
      tab.className = `month-tab px-3 md:px-4 py-2 text-xs md:text-sm font-medium border rounded-md transition-all duration-200 ${index === currentMonthIndex ? "active" : "hover:bg-slate-700 hover:text-slate-200"}`
      tab.onclick = () => {
        currentMonthIndex = index
        const today = new Date()
        selectedDay =
          currentYear === today.getFullYear() && currentMonthIndex === today.getMonth() ? today.getDate() - 1 : 0
        renderApp()
      }
      tabsContainer.appendChild(tab)
    })
  } catch (error) {
    console.error("Error rendering month tabs:", error)
  }
}

// Render table for selected month
function renderTableForMonth() {
  try {
    const tableHead = document.getElementById("table-head")
    const tableBody = document.getElementById("table-body")
    const tableFoot = document.getElementById("table-foot")
    if (!tableHead || !tableBody || !tableFoot) return

    const today = new Date()
    const isCurrentMonthView = today.getFullYear() === currentYear && today.getMonth() === currentMonthIndex
    const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex)
    let headHtml = '<tr><th class="category-header px-4 py-3">קטגוריה</th>'
    for (let day = 1; day <= daysInMonth; day++) {
      headHtml += `<th class="px-4 py-3 ${isCurrentMonthView && day === today.getDate() ? "today-header" : ""}">${day}</th>`
    }
    headHtml += '<th class="px-4 py-3 bg-blue-800/30 text-blue-300">סה"כ</th></tr>' // Updated header color
    tableHead.innerHTML = headHtml

    let bodyHtml = ""
    const monthData = cashflowData.years[currentYear][currentMonthIndex]
    const businessType = cashflowData.vatSettings?.businessType

    // Loop through category groups (income, suppliers, etc.)
    Object.entries(userCategories).forEach(([groupName, groupDetails]) => {
      // Skip certain categories based on business type and VAT settings
      if (cashflowData.vatSettings?.businessType === "exempt" && groupDetails.vatRelated) return
      if (groupName === "הכנסות פטורות ממע'מ" && !cashflowData.vatSettings?.hasExemptIncome) return

      // Add group header row
      bodyHtml += `<tr class="${groupDetails.color} font-bold group-header-row"><td class="category-cell">${groupName}</td><td colspan="${daysInMonth + 1}"></td></tr>`

      // Loop through category items within the group
      Object.entries(groupDetails.items).forEach(([catKey, catDetails]) => {
        // Skip specific fields not relevant to current business type
        if (catDetails.businessTypes && !catDetails.businessTypes.includes(businessType)) {
          return
        }

        // UPDATED: Logic to show input for custom rows and static div for fixed rows
        const isCustom = !catDetails.fixed;
        const displayName = monthData.customNames?.[catKey] || catDetails.name || catDetails.placeholder || "";
        const placeholderText = catDetails.placeholder || "הקלד שם...";
        const isCalculated = catDetails.type === "expense_calculated";

        bodyHtml += `<tr class="border-b border-slate-700" data-category-row="${catKey}">`; // Added border-slate-700
        
        if (isCustom) {
          // For custom rows, allow direct editing in the table
          bodyHtml += `<td class="category-cell p-1"><input type="text" class="category-name-input" placeholder="${placeholderText}" value="${displayName}" data-cat-id="${catKey}"></td>`;
        } else {
          // For fixed rows, show a static div. Name can be edited in settings.
          const finalDisplayName = monthData.customNames?.[catKey] || catDetails.name;
          bodyHtml += `<td class="category-cell p-1"><div class="category-cell-static">${finalDisplayName}</div></td>`;
        }
        
        // Display daily data
        const dailyData = monthData.categories[catKey] || Array(daysInMonth).fill(0)
        for (let day = 0; day < daysInMonth; day++) {
          const value = dailyData[day] || 0
          const formattedValue = value !== 0 ? formatWithCommas(value.toLocaleString("en-US")) : ""
          bodyHtml += `<td class="p-1"><input type="text" inputmode="decimal" class="table-cell-input formatted-number-input" value="${formattedValue}" placeholder="0" data-day="${day}" data-category="${catKey}" ${isCalculated ? "disabled" : ""}></td>`
        }
        bodyHtml += `<td class="font-bold px-4 py-2 monthly-sum text-blue-300"></td></tr>` // Updated sum color
      })
      // Add group summary row
      bodyHtml += `<tr class="group-summary-row border-b border-slate-600"><td class="category-cell px-4 py-2 font-bold text-blue-300">סיכום ${groupName}</td><td colspan="${daysInMonth}"></td><td class="px-4 py-2 font-bold text-blue-300" data-group-sum="${groupName}"></td></tr>` // Updated colors
    })
    bodyHtml += `<tr class="bg-slate-800 text-white font-bold group-header-row"><td class="category-cell" colspan="${daysInMonth + 2}">סיכום ויתרות</td></tr>`
    tableBody.innerHTML = bodyHtml

    // Render table footer (balances)
    let footHtml = `<tr class="border-b border-slate-700 bg-slate-700"><td class="category-cell px-4 py-2 text-right font-bold text-slate-200">יתרת פתיחה לחודש</td><td id="month-opening-balance" class="font-bold px-4 py-2" colspan="${daysInMonth + 1}"></td></tr>`
    footHtml += `<tr class="border-b border-slate-700 balance-row bg-slate-700"><td class="category-cell px-4 py-2 text-right text-slate-200">מאזן יומי</td>`
    for (let i = 0; i < daysInMonth; i++) footHtml += `<td class="font-bold px-4 py-2 daily-balance text-slate-200"></td>`
    footHtml += `<td class="font-bold px-4 py-2 text-slate-200"></td></tr>`
    footHtml += `<tr class="border-b border-slate-700 balance-row bg-slate-700"><td class="category-cell px-4 py-2 text-right text-slate-200">מאזן יומי מתגלגל</td>`
    for (let i = 0; i < daysInMonth; i++) footHtml += `<td class="font-bold px-4 py-2 running-balance text-slate-200"></td>`
    footHtml += `<td class="font-bold px-4 py-2 text-slate-200"></td></tr>`
    tableFoot.innerHTML = footHtml
  } catch (error) {
    console.error("Error rendering table:", error)
  }
}

// Render mobile view
function renderMobileView() {
  try {
    const container = document.getElementById("mobile-view-container")
    if (!container) return
    const monthData = cashflowData.years[currentYear][currentMonthIndex]
    const today = new Date()
    const isToday =
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonthIndex &&
      today.getDate() - 1 === selectedDay
    const businessType = cashflowData.vatSettings?.businessType

    let html = `<div class="day-selector-header p-4 flex justify-between items-center ${isToday ? "today" : ""}"><button id="prev-day-btn" class="nav-button"><i class="fas fa-chevron-right"></i></button><h2 class="text-lg font-bold">יום ${selectedDay + 1} / ${months[currentMonthIndex]}</h2><button id="next-day-btn" class="nav-button"><i class="fas fa-chevron-left"></i></button></div><div class="p-4 space-y-4">`
    // Loop through category groups for mobile view
    Object.entries(userCategories).forEach(([groupName, groupDetails]) => {
      // Skip certain categories based on business type
      if (groupName === "הכנסות פטורות ממע'מ" && !cashflowData.vatSettings?.hasExemptIncome) return

      html += `<div><h3 class="font-bold text-lg mb-2 p-2 ${groupDetails.color}">${groupName}</h3><div class="space-y-2">`
      // Loop through category items within the group
      Object.entries(groupDetails.items).forEach(([catKey, catDetails]) => {
        // Skip specific fields not relevant to current business type
        if (catDetails.businessTypes && !catDetails.businessTypes.includes(businessType)) {
          return
        }

        const isCustom = !catDetails.fixed;
        const displayName = monthData.customNames?.[catKey] || catDetails.name || catDetails.placeholder || "";
        const placeholderText = catDetails.placeholder || "הקלד שם...";
        const isCalculated = catDetails.type === "expense_calculated";
        const value = monthData.categories[catKey]?.[selectedDay] || 0;
        const formattedValue = value !== 0 ? value.toLocaleString("en-US") : "";
        html += `<div class="flex items-center justify-between p-2 border-b border-slate-700">`; // Added border-slate-700
        
        if (isCustom) {
          html += `<input type="text" class="category-name-input w-2/3" placeholder="${placeholderText}" value="${displayName}" data-cat-id="${catKey}">`;
        } else {
          const finalDisplayName = monthData.customNames?.[catKey] || catDetails.name;
          html += `<label class="w-2/3 text-slate-300">${finalDisplayName}</label>`; // Added text-slate-300
        }
        
        html += `<input type="text" inputmode="decimal" class="table-cell-input formatted-number-input w-1/3" value="${formattedValue}" placeholder="0" data-day="${selectedDay}" data-category="${catKey}" ${isCalculated ? "disabled" : ""}></div>`;
      })
      html += `</div></div>`
    })
    html += `<div class="mt-6 border-t border-slate-700 pt-4 space-y-2"><div class="flex justify-between font-bold text-lg"><p>מאזן יומי:</p><p id="mobile-daily-balance">0 ₪</p></div><div class="flex justify-between font-bold text-lg"><p>מאזן מתגלגל:</p><p id="mobile-running-balance">0 ₪</p></div></div>`
    html += `</div>`
    container.innerHTML = html
    document.getElementById("prev-day-btn").addEventListener("click", () => changeDay(-1))
    document.getElementById("next-day-btn").addEventListener("click", () => changeDay(1))
  } catch (error) {
    console.error("Error rendering mobile view:", error)
  }
}

// Change day in mobile view
function changeDay(direction) {
  try {
    const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex)
    selectedDay += direction
    if (selectedDay < 0) selectedDay = daysInMonth - 1
    if (selectedDay >= daysInMonth) selectedDay = 0
    renderMobileView()
    updateAllCalculations()
  } catch (error) {
    console.error("Error changing day:", error)
  }
}

// Run all calculations again
function updateAllCalculations() {
  try {
    // Protection: Do not run calculations if essential data is not loaded
    if (!currentUser || Object.keys(userCategories).length === 0) {
      return
    }

    calculateVAT() // Calculate VAT
    processVATPayments() // Process VAT payments
    recalculateAllSums() // Recalculate all monthly and group sums
    calculateRunningBalance() // Calculate running balance
    updateSummaryCards() // Update summary cards at the top of the page
  } catch (error) {
    console.error("Error updating calculations:", error)
  }
}

// Update summary cards (income, expenses, monthly balance)
function updateSummaryCards() {
  try {
    if (Object.keys(userCategories).length === 0) return;

    const monthData = cashflowData.years[currentYear][currentMonthIndex].categories;
    const businessType = cashflowData.vatSettings?.businessType;
    const today = new Date();
    const currentDayIndex = (today.getFullYear() === currentYear && today.getMonth() === currentMonthIndex) ? today.getDate() - 1 : -1;

    let totalIncome = 0;
    let totalExpense = 0;
    let employeeWages = 0;
    let ownerWages = 0;
    let totalMonthlyLoans = 0;
    let paidLoans = 0;

    Object.values(userCategories).forEach((group) => {
      Object.entries(group.items).forEach(([catKey, catDetails]) => {
        if (catDetails.businessTypes && !catDetails.businessTypes.includes(businessType)) {
          return;
        }

        const dailyValues = monthData[catKey] || [];
        const monthlySum = dailyValues.reduce((acc, val) => acc + (Number.parseFloat(val) || 0), 0);

        if (catDetails.type === "income" || catDetails.type === "exempt_income") {
          totalIncome += monthlySum;
        } else if (catDetails.type.startsWith("expense") || catDetails.type === "employee_cost" || catDetails.type.startsWith("partial_vat_expense")) {
          totalExpense += monthlySum;
        }

        if (catKey === 'salaries') {
            employeeWages += monthlySum;
        }
        if (catKey === 'controlling_salary' || catKey === 'owner_withdrawal' || catKey === 'dividend_withdrawal') {
            ownerWages += monthlySum;
        }

        if (group.hex === '#0ea5e9') { // Loans group (updated hex for dark theme)
            totalMonthlyLoans += monthlySum;
            if (currentDayIndex !== -1) {
                for (let day = 0; day <= currentDayIndex; day++) {
                    paidLoans += Number.parseFloat(dailyValues[day] || 0);
                }
            } else {
                paidLoans += monthlySum;
            }
        }
      });
    });

    if (monthData["vat_payment"]) {
      totalExpense += monthData["vat_payment"].reduce((a, b) => a + (Number.parseFloat(b) || 0), 0);
    }

    const monthlyBalance = totalIncome - totalExpense;
    const totalWages = employeeWages + ownerWages;
    const remainingLoans = totalMonthlyLoans - paidLoans;

    // --- Update DOM Elements and their colors ---

    // Card 1: Main Balance
    const incomeEl = document.getElementById("dashboard-income");
    incomeEl.textContent = formatCurrency(totalIncome);
    incomeEl.className = "text-2xl lg:text-3xl font-bold text-green-400"; // Updated color
    
    const expenseEl = document.getElementById("dashboard-expense");
    expenseEl.textContent = formatCurrency(totalExpense);
    expenseEl.className = "text-2xl lg:text-3xl font-bold text-red-400"; // Updated color

    const balanceEl = document.getElementById("dashboard-balance");
    balanceEl.textContent = formatCurrency(monthlyBalance);
    balanceEl.className = `text-2xl lg:text-3xl font-bold ${monthlyBalance >= 0 ? "text-green-400" : "text-red-400"}`; // Updated colors

    // Card 2: Salaries
    const ownerCostLabel = document.getElementById("owner-cost-label");
    if (businessType === 'company') {
        ownerCostLabel.textContent = 'שכר בעלי שליטה (חודשי)';
    } else {
        ownerCostLabel.textContent = 'משיכת בעלים (חודשי)';
    }
    const employeeWagesEl = document.getElementById("dashboard-employee-wages");
    employeeWagesEl.textContent = formatCurrency(employeeWages);
    employeeWagesEl.className = "text-2xl lg:text-3xl font-bold text-red-400"; // Updated color

    const ownerWagesEl = document.getElementById("dashboard-owner-wages");
    ownerWagesEl.textContent = formatCurrency(ownerWages);
    ownerWagesEl.className = "text-2xl lg:text-3xl font-bold text-red-400"; // Updated color

    const totalWagesEl = document.getElementById("dashboard-total-wages");
    totalWagesEl.textContent = formatCurrency(totalWages);
    totalWagesEl.className = "text-2xl lg:text-3xl font-bold text-red-400"; // Updated color

    // Card 3: Loans
    const totalLoansEl = document.getElementById("dashboard-total-loans");
    totalLoansEl.textContent = formatCurrency(totalMonthlyLoans);
    totalLoansEl.className = "text-2xl lg:text-3xl font-bold text-red-400"; // Updated color
    
    const paidLoansEl = document.getElementById("dashboard-paid-loans");
    paidLoansEl.textContent = formatCurrency(paidLoans);
    paidLoansEl.className = "text-2xl lg:text-3xl font-bold text-green-400"; // Updated color

    const remainingLoansEl = document.getElementById("dashboard-remaining-loans");
    remainingLoansEl.textContent = formatCurrency(remainingLoans);
    remainingLoansEl.className = "text-2xl lg:text-3xl font-bold text-red-400"; // Updated color
    
  } catch (error) {
    console.error("Error updating summary cards:", error);
  }
}


// Recalculate all monthly and group sums in the table
function recalculateAllSums() {
  try {
    // Protection: Do not run if categories are not loaded
    if (Object.keys(userCategories).length === 0) return

    const monthData = cashflowData.years[currentYear][currentMonthIndex].categories
    const groupSums = {}
    const businessType = cashflowData.vatSettings?.businessType

    // Loop through category groups to sum each group
    Object.entries(userCategories).forEach(([groupName, groupDetails]) => {
      let groupSum = 0
      Object.entries(groupDetails.items).forEach(([catKey, catDetails]) => {
        // Skip specific fields not relevant to current business type
        if (catDetails.businessTypes && !catDetails.businessTypes.includes(businessType)) {
          return
        }

        const sum = (monthData[catKey] || []).reduce((acc, val) => acc + (Number.parseFloat(val) || 0), 0)

        // Update monthly sum cell for each row
        const row = document.querySelector(`[data-category-row="${catKey}"]`)
        if (row) {
          const sumCell = row.querySelector(".monthly-sum")
          if (sumCell) sumCell.textContent = formatCurrency(sum)
        }
        groupSum += sum
      })
      groupSums[groupName] = groupSum
    })

    // Calculate aggregated sums for certain groups
    const aggregatedVariableSum = (groupSums["הוצאות משתנות"] || 0) + (groupSums["ספקים"] || 0)
    const aggregatedFixedSum = (groupSums["הוצאות קבועות"] || 0) + (groupSums["הלוואות"] || 0)

    // Update group summary cells in the table
    Object.entries(groupSums).forEach(([groupName, sum]) => {
      const groupSumCell = document.querySelector(`[data-group-sum="${groupName}"]`)
      if (groupSumCell) {
        if (groupName === "הוצאות משתנות") {
          groupSumCell.textContent = formatCurrency(aggregatedVariableSum)
        } else if (groupName === "הוצאות קבועות") {
          groupSumCell.textContent = formatCurrency(aggregatedFixedSum)
        } else {
          groupSumCell.textContent = formatCurrency(sum)
        }
      }
    })
  } catch (error) {
    console.error("Error recalculating sums:", error)
    showToast("שגיאה בחישוב הסכומים")
  }
}

// --- VAT calculation ---
function calculateVAT() {
  try {
    // Protection: Do not run if categories are not loaded
    if (Object.keys(userCategories).length === 0) return

    // If business is "exempt", no need to calculate VAT
    if (cashflowData.vatSettings?.businessType === "exempt") {
      // Ensure VAT fields are zeroed out if business is exempt
      const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex)
      if (cashflowData.years[currentYear][currentMonthIndex].categories["vat_field"]) {
        cashflowData.years[currentYear][currentMonthIndex].categories["vat_field"] = Array(daysInMonth).fill(0)
      }
      if (cashflowData.years[currentYear][currentMonthIndex].categories["vat_payment"]) {
        cashflowData.years[currentYear][currentMonthIndex].categories["vat_payment"] = Array(daysInMonth).fill(0)
      }
      // Update UI to reflect zero VAT
      for (let day = 0; day < daysInMonth; day++) {
        const vatFieldInput = document.querySelector(`input[data-category="vat_field"][data-day="${day}"]`)
        if (vatFieldInput) vatFieldInput.value = ""
        const vatPaymentInput = document.querySelector(`input[data-category="vat_payment"][data-day="${day}"]`)
        if (vatPaymentInput) vatPaymentInput.value = ""
      }
      return
    }

    ensureDataStructure(currentYear, currentMonthIndex)
    const monthData = cashflowData.years[currentYear][currentMonthIndex].categories
    const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex)
    const businessType = cashflowData.vatSettings?.businessType

    for (let day = 0; day < daysInMonth; day++) {
      let incomeVAT = 0,
        expenseVAT = 0

      // Calculate VAT on income: Assumption is that entered amount includes VAT (gross)
      // Loop through "Income" group items
      if (userCategories["הכנסות"] && userCategories["הכנסות"].items) {
        Object.keys(userCategories["הכנסות"].items).forEach((catKey) => {
          incomeVAT += (Number.parseFloat(monthData[catKey]?.[day]) || 0) * (VAT_RATE / (1 + VAT_RATE))
        })
      }
      // Calculate VAT on exempt income (if enabled)
      if (
        cashflowData.vatSettings?.hasExemptIncome &&
        userCategories["הכנסות פטורות ממע'מ"] &&
        userCategories["הכנסות פטורות ממע'מ"].items
      ) {
        Object.keys(userCategories["הכנסות פטורות ממע'מ"].items).forEach((catKey) => {
          // Exempt income does not include VAT, so no need to add to incomeVAT
        })
      }
      // Calculate VAT on regular expenses: Assumption is that entered amount does not include VAT
      ;["ספקים", "הוצאות משתנות", "הוצאות קבועות", "הוצאות בלתי צפויות"].forEach((groupKey) => {
        if (userCategories[groupKey] && userCategories[groupKey].items) {
          Object.keys(userCategories[groupKey].items).forEach((catKey) => {
            const itemType = userCategories[groupKey].items[catKey].type
            // Skip specific fields not relevant to current business type
            if (
              userCategories[groupKey].items[catKey].businessTypes &&
              !userCategories[groupKey].items[catKey].businessTypes.includes(businessType)
            ) {
              return
            }
            // Add VAT only to 'expense' type expenses (not 'expense_no_vat' or 'employee_cost')
            if (itemType === "expense") {
              expenseVAT += (Number.parseFloat(monthData[catKey]?.[day]) || 0) * VAT_RATE
            }
          })
        }
      })

      // Calculate VAT on partially recognized expenses (like car, phone)
      if (userCategories["הוצאות עם הכרה חלקית במע'מ"] && userCategories["הוצאות עם הכרה חלקית במע'מ"].items) {
        Object.keys(userCategories["הוצאות עם הכרה חלקית במע'מ"].items).forEach((catKey) => {
          const item = userCategories["הוצאות עם הכרה חלקית במע'מ"].items[catKey]
          const vatRecognitionRate = item.vatRate || 0.67 // VAT recognition rate (e.g., 67% for car)
          expenseVAT += (Number.parseFloat(monthData[catKey]?.[day]) || 0) * VAT_RATE * vatRecognitionRate
        })
      }

      // Calculate net VAT for the day (difference between income VAT and expense VAT)
      const netVatForDay = incomeVAT - expenseVAT

      // Save daily VAT calculation
      if (!cashflowData.vatCalculations) cashflowData.vatCalculations = {}
      if (!cashflowData.vatCalculations[currentYear]) cashflowData.vatCalculations[currentYear] = {}
      if (!cashflowData.vatCalculations[currentYear][currentMonthIndex]) {
        cashflowData.vatCalculations[currentYear][currentMonthIndex] = Array(daysInMonth).fill(0)
      }
      cashflowData.vatCalculations[currentYear][currentMonthIndex][day] = Math.round(netVatForDay)

      // Update calculated field in the table
      monthData["vat_field"][day] = Math.round(netVatForDay)
      const vatInput = document.querySelector(`input[data-category="vat_field"][data-day="${day}"]`)
      if (vatInput)
        vatInput.value = monthData["vat_field"][day] !== 0 ? formatWithCommas(monthData["vat_field"][day]) : ""
    }
  } catch (error) {
    console.error("Error calculating VAT:", error)
  }
}

// Process VAT payments (monthly/bimonthly)
function processVATPayments() {
  try {
    // If no VAT settings or business is exempt, no need to process payments
    if (!cashflowData.vatSettings || cashflowData.vatSettings.businessType === "exempt") return

    const { frequency, paymentDay } = cashflowData.vatSettings

    const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonthIndex)
    // Zero out VAT payment field at the beginning of each processing
    if (cashflowData.years[currentYear][currentMonthIndex].categories["vat_payment"]) {
      cashflowData.years[currentYear][currentMonthIndex].categories["vat_payment"] = Array(daysInCurrentMonth).fill(0)
    }

    if (frequency === "monthly") {
      processMonthlyVAT(paymentDay)
    } else if (frequency === "bimonthly") {
      processBimonthlyVAT(paymentDay)
    }
  } catch (error) {
    console.error("Error processing VAT payments:", error)
  }
}

// Process monthly VAT payment
function processMonthlyVAT(paymentDay) {
  const prevMonthDate = new Date(currentYear, currentMonthIndex - 1)
  const prevMonthYear = prevMonthDate.getFullYear()
  const prevMonth = prevMonthDate.getMonth()

  // If VAT calculations exist for previous month
  if (cashflowData.vatCalculations?.[prevMonthYear]?.[prevMonth]) {
    const prevMonthVATArray = cashflowData.vatCalculations[prevMonthYear][prevMonth]
    const totalVAT = prevMonthVATArray.reduce((sum, daily) => sum + (daily || 0), 0)

    // If there's VAT to pay (positive), record it as an expense
    if (totalVAT > 0) {
      postVatPayment(totalVAT, paymentDay)
    }
  }
}

// Process bimonthly VAT payment
function processBimonthlyVAT(paymentDay) {
  // Check if current month is a payment month (January, March, May, etc.)
  const isPaymentMonth = (currentMonthIndex + 1) % 2 !== 0

  if (isPaymentMonth) {
    const prevMonth1Date = new Date(currentYear, currentMonthIndex - 1)
    const prevMonth2Date = new Date(currentYear, currentMonthIndex - 2)

    let totalVAT = 0

    // Sum VAT from the two previous months
    ;[prevMonth2Date, prevMonth1Date].forEach((month) => {
      if (cashflowData.vatCalculations?.[month.getFullYear()]?.[month.getMonth()]) {
        const monthVATArray = cashflowData.vatCalculations[month.getFullYear()][month.getMonth()]
        totalVAT += monthVATArray.reduce((sum, daily) => sum + (daily || 0), 0)
      }
    })

    // If there's VAT to pay (positive), record it as an expense
    if (totalVAT > 0) {
      postVatPayment(totalVAT, paymentDay)
    }
  }
}

// Record VAT payment in the appropriate field in the table
function postVatPayment(amount, paymentDay) {
  ensureDataStructure(currentYear, currentMonthIndex)
  const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex)
  // Ensure payment day does not exceed number of days in month
  const actualPaymentDay = Math.min(paymentDay - 1, daysInMonth - 1)

  // Ensure 'vat_payment' field exists and is initialized
  if (!cashflowData.years[currentYear][currentMonthIndex].categories["vat_payment"]) {
    cashflowData.years[currentYear][currentMonthIndex].categories["vat_payment"] = Array(daysInMonth).fill(0)
  }
  // Record VAT amount on payment day
  cashflowData.years[currentYear][currentMonthIndex].categories["vat_payment"][actualPaymentDay] = amount

  // Update input field in UI
  const vatPaymentInput = document.querySelector(`input[data-category="vat_payment"][data-day="${actualPaymentDay}"]`)
  if (vatPaymentInput) {
    vatPaymentInput.value = amount > 0 ? formatWithCommas(amount) : ""
  }
}

// --- Calculate running balance ---
function calculateRunningBalance() {
  try {
    // Protection: Do not run if categories are not loaded
    if (Object.keys(userCategories).length === 0) return

    const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex)
    const monthData = cashflowData.years[currentYear][currentMonthIndex].categories
    // Get opening balance for the month, which already includes balances from previous months and years
    const openingBalanceForMonth = getMonthlyOpeningBalance()
    let runningBalance = openingBalanceForMonth
    const dailyBalanceCells = document.querySelectorAll(".daily-balance")
    const runningBalanceCells = document.querySelectorAll(".running-balance")
    const gapDays = [] // Days with bank limit overdraft
    const businessType = cashflowData.vatSettings?.businessType

    // Loop through each day of the month
    for (let day = 0; day < daysInMonth; day++) {
      let dailyIncome = 0,
        dailyExpense = 0

      // Sum all income and expenses for the day
      Object.values(userCategories).forEach((group) => {
        Object.entries(group.items).forEach(([catKey, catDetails]) => {
          // Skip specific fields not relevant to current business type
          if (catDetails.businessTypes && !catDetails.businessTypes.includes(businessType)) {
            return
          }

          const value = Number.parseFloat(monthData[catKey]?.[day] || 0)
          if (catDetails.type === "income" || catDetails.type === "exempt_income") dailyIncome += value
          else if (
            catDetails.type.startsWith("expense") ||
            catDetails.type === "employee_cost" ||
            catDetails.type.startsWith("partial_vat_expense") ||
            catDetails.type === "expense_no_vat"
          ) {
            dailyExpense += value
          }
        })
      })

      // Add VAT payment to daily expenses if exists
      if (monthData["vat_payment"]) {
        dailyExpense += Number.parseFloat(monthData["vat_payment"][day] || 0)
      }

      const dailyNet = dailyIncome - dailyExpense // Net balance for current day
      runningBalance += dailyNet // Update running balance

      // Update daily balance cell in the table
      if (dailyBalanceCells[day]) dailyBalanceCells[day].textContent = formatCurrency(dailyNet)

      // Check if balance exceeds bank limit
      const bankLimit = Number.parseFloat(String(cashflowData.bankLimit || "0").replace(/,/g, ""))
      const isOverLimit = bankLimit > 0 && runningBalance < -bankLimit

      if (isOverLimit) {
        gapDays.push(day) // Add day to overdraft list
      }

      // Update running balance cells in display with appropriate color
      if (runningBalanceCells[day]) {
        runningBalanceCells[day].textContent = formatCurrency(runningBalance)
        let className = `font-bold px-4 py-2 running-balance ${runningBalance >= 0 ? "text-green-400" : "text-red-400"}` // Updated colors
        if (isOverLimit) {
          className += " bg-red-800/20 border-2 border-red-500 rounded-md" // Added rounded-md for visual appeal
          runningBalanceCells[day].title = `חריגה ממסגרת הבנק! מסגרת: ${formatCurrency(-bankLimit)}`
        } else {
          runningBalanceCells[day].title = ""
        }
        runningBalanceCells[day].className = className
      }

      // Update mobile view for selected day
      if (day === selectedDay) {
        const mobileDailyEl = document.getElementById("mobile-daily-balance")
        const mobileRunningEl = document.getElementById("mobile-running-balance")
        if (mobileDailyEl) mobileDailyEl.textContent = formatCurrency(dailyNet)
        if (mobileRunningEl) {
          mobileRunningEl.textContent = formatCurrency(runningBalance)
          mobileRunningEl.className = `font-bold text-lg ${runningBalance >= 0 ? "text-green-400" : "text-red-400"}` // Updated colors
        }
      }
    }
    updateDailyGapAlerts(gapDays) // Update cashflow gap alerts on column headers
  } catch (error) {
    console.error("Error calculating running balance:", error)
  }
}

// Calculate monthly net (income minus expenses)
function getMonthlyNet(year, month) {
  try {
    ensureDataStructure(year, month)
    const monthData = cashflowData.years[year][month].categories
    let totalIncome = 0,
      totalExpense = 0
    const businessType = cashflowData.vatSettings?.businessType

    // Loop through all categories to sum income and expenses
    Object.values(userCategories).forEach((group) => {
      Object.entries(group.items).forEach(([catKey, catDetails]) => {
        // Skip specific fields not relevant to current business type
        if (catDetails.businessTypes && !catDetails.businessTypes.includes(businessType)) {
          return
        }

        const sum = (monthData[catKey] || []).reduce((a, b) => a + (Number.parseFloat(b) || 0), 0)
        if (catDetails.type === "income" || catDetails.type === "exempt_income") {
          totalIncome += sum
        } else if (
          catDetails.type.startsWith("expense") ||
          catDetails.type === "employee_cost" ||
          catDetails.type.startsWith("partial_vat_expense") ||
          catDetails.type === "expense_no_vat"
        ) {
          totalExpense += sum
        }
      })
    })

    // Add VAT payment to total expenses if exists
    if (monthData["vat_payment"]) {
      totalExpense += monthData["vat_payment"].reduce((a, b) => a + (Number.parseFloat(b) || 0), 0)
    }

    return totalIncome - totalExpense
  } catch (error) {
    console.error("Error getting monthly net:", error)
    return 0
  }
}

// --- Calculate monthly opening balance (including carry-over from previous years) ---
function getMonthlyOpeningBalance() {
  try {
    // 1. Start with global opening balance (initial entered balance)
    let openingBalanceForMonth = Number.parseFloat(String(cashflowData.openingBalance || "0").replace(/,/g, ""))

    // 2. Add net balance of all years prior to current year
    // Find the first year with data
    const firstYear =
      Object.keys(cashflowData.years || {}).length > 0
        ? Math.min(...Object.keys(cashflowData.years).map(Number))
        : currentYear
    for (let year = firstYear; year < currentYear; year++) {
      if (cashflowData.years[year]) {
        openingBalanceForMonth += getYearlyNet(year)
      }
    }

    // 3. Add net balance of previous months within current year
    for (let i = 0; i < currentMonthIndex; i++) {
      ensureDataStructure(currentYear, i) // Ensure data structure exists for this month
      openingBalanceForMonth += getMonthlyNet(currentYear, i)
    }

    // Update display for monthly opening balance in table footer
    const monthOpeningBalanceEl = document.getElementById("month-opening-balance")
    if (monthOpeningBalanceEl) {
      monthOpeningBalanceEl.textContent = formatCurrency(openingBalanceForMonth)
      monthOpeningBalanceEl.className = `font-bold px-4 py-2 ${openingBalanceForMonth >= 0 ? "text-green-400" : "text-red-400"}` // Updated colors
    }

    return openingBalanceForMonth
  } catch (error) {
    console.error("Error getting monthly opening balance:", error)
    return 0
  }
}

// Helper function to calculate total net for a given year
function getYearlyNet(year) {
  let yearlyNet = 0
  // Loop through all 12 months of the given year
  for (let i = 0; i < 12; i++) {
    // Ensure data structure exists for each month
    ensureDataStructure(year, i)
    yearlyNet += getMonthlyNet(year, i)
  }
  return yearlyNet
}

// Calculate total monthly income or expenses by type
function getMonthlyTotal(type) {
  try {
    ensureDataStructure(currentYear, currentMonthIndex)
    const monthData = cashflowData.years[currentYear][currentMonthIndex].categories
    let total = 0
    const businessType = cashflowData.vatSettings?.businessType

    // Loop through all categories
    Object.values(userCategories).forEach((group) => {
      Object.entries(group.items).forEach(([catKey, catDetails]) => {
        // Skip specific fields not relevant to current business type
        if (catDetails.businessTypes && !catDetails.businessTypes.includes(businessType)) {
          return
        }

        if (type === "income" && (catDetails.type === "income" || catDetails.type === "exempt_income")) {
          const sum = (monthData[catKey] || []).reduce((a, b) => a + (Number.parseFloat(b) || 0), 0)
          total += sum
        } else if (
          type === "expense" &&
          (catDetails.type.startsWith("expense") ||
            catDetails.type === "employee_cost" ||
            catDetails.type.startsWith("partial_vat_expense") ||
            catDetails.type === "expense_no_vat")
        ) {
          const sum = (monthData[catKey] || []).reduce((a, b) => a + (Number.parseFloat(b) || 0), 0)
          total += sum
        }
      })
    })

    // Add VAT payment to total expenses if type is 'expense'
    if (type === "expense" && monthData["vat_payment"]) {
      total += monthData["vat_payment"].reduce((a, b) => a + (Number.parseFloat(b) || 0), 0)
    }

    return total
  } catch (error) {
    console.error("Error getting monthly total:", error)
    return 0
  }
}

// Function to format numbers as currency (ILS)
function formatCurrency(value) {
  try {
    if (typeof value !== "number") {
      value = Number(value) || 0
    }
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  } catch (error) {
    console.error("Currency formatting error:", error)
    const num = Math.round(value || 0)
    return `${num.toLocaleString("en-US")} ₪`
  }
}

// Function to format numbers with commas
function formatWithCommas(value) {
  try {
    if (typeof value !== "number") {
      value = Number(value) || 0
    }
    return new Intl.NumberFormat("en-US").format(value)
  } catch (error) {
    console.error("Comma formatting error:", error)
    return value?.toString() || "0"
  }
}

// Show toast notification (short popup message)
function showToast(message) {
  try {
    const toast = document.getElementById("toast")
    if (toast) {
      toast.textContent = message
      toast.classList.add("show")
      setTimeout(() => toast.classList.remove("show"), 3000)
    }
  } catch (error) {
    console.error("Error showing toast:", error)
  }
}

// Get number of days in a given month
function getDaysInMonth(year, month) {
  try {
    return new Date(year, month + 1, 0).getDate()
  } catch (error) {
    return 30 // Default in case of error
  }
}

// --- Ensure data structure exists for a given year and month ---
function ensureDataStructure(year, month) {
  try {
    if (!cashflowData.years) cashflowData.years = {}
    if (!cashflowData.years[year]) cashflowData.years[year] = {}
    if (!cashflowData.years[year][month]) {
      const daysInMonth = getDaysInMonth(year, month)
      cashflowData.years[year][month] = { categories: {}, customNames: {} }
      // Use userCategories (loaded from DB or default) to populate structure
      Object.values(userCategories).forEach((group) => {
        Object.keys(group.items).forEach((catKey) => {
          // Only if category is relevant to current business type
          const businessType = cashflowData.vatSettings?.businessType
          const catDetails = group.items[catKey]
          if (!catDetails.businessTypes || catDetails.businessTypes.includes(businessType)) {
            if (!cashflowData.years[year][month].categories[catKey]) {
              cashflowData.years[year][month].categories[catKey] = Array(daysInMonth).fill(0)
            }
          }
        })
      })
    }
  } catch (error) {
    console.error("Error ensuring data structure:", error)
  }
}

// --- Handle user input (text fields and input) ---
function handleInput(e) {
  try {
    const target = e.target
    let isAppDataChanged = false // Flag to check if calculations and saving should run

    if (target.id === "clientName") {
      cashflowData.clientName = target.value
      isAppDataChanged = true
    } else if (target.id === "openingBalance") {
      const rawValue = target.value.replace(/,/g, "")
      cashflowData.openingBalance = Number.parseFloat(rawValue) || 0
      target.classList.remove("opening-balance-positive", "opening-balance-negative")
      if (cashflowData.openingBalance < 0) {
        target.classList.add("opening-balance-negative")
      } else if (cashflowData.openingBalance > 0) {
        target.classList.add("opening-balance-positive")
      }
      isAppDataChanged = true
    } else if (target.id === "bankLimit") {
      cashflowData.bankLimit = Number.parseFloat(target.value.replace(/,/g, "")) || 0
      isAppDataChanged = true
    } else if (target.classList.contains("table-cell-input") || target.classList.contains("formatted-number-input")) {
      ensureDataStructure(currentYear, currentMonthIndex)
      const unformattedValue = target.value.replace(/,/g, "")
      const { day, category } = target.dataset
      if (day !== undefined && category) {
        cashflowData.years[currentYear][currentMonthIndex].categories[category][Number.parseInt(day)] =
          Number.parseFloat(unformattedValue) || 0
      }
      isAppDataChanged = true
    } else if (target.classList.contains("category-name-input")) {
      ensureDataStructure(currentYear, currentMonthIndex)
      const { catId } = target.dataset
      if (catId) {
        if (!cashflowData.years[currentYear][currentMonthIndex].customNames) {
          cashflowData.years[currentYear][currentMonthIndex].customNames = {}
        }
        cashflowData.years[currentYear][currentMonthIndex].customNames[catId] = target.value
      }
      isAppDataChanged = true
    }

    // Run calculations and auto-save only if app data changed
    if (isAppDataChanged) {
      updateAllCalculations()
      if (cashflowData.settings?.autoSave) {
        debouncedSave()
      }
    }
  } catch (error) {
    console.error("Error handling input:", error)
  }
}

// Copy fixed expenses and loans from previous month
function copyFixedExpenses() {
  try {
    const prevMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1
    const prevYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear
    ensureDataStructure(prevYear, prevMonthIndex)
    const prevMonthData = cashflowData.years[prevYear][prevMonthIndex]
    const currentMonthData = cashflowData.years[currentYear][currentMonthIndex]
    const businessType = cashflowData.vatSettings?.businessType

    // Copy data for "Fixed Expenses" and "Loans" groups
    ;["הוצאות קבועות", "הלוואות"].forEach((groupKey) => {
      if (userCategories[groupKey] && userCategories[groupKey].items) {
        Object.keys(userCategories[groupKey].items).forEach((catKey) => {
          const catDetails = userCategories[groupKey].items[catKey]
          // Copy only if category is relevant to current business type
          if (!catDetails.businessTypes || catDetails.businessTypes.includes(businessType)) {
            if (prevMonthData.categories[catKey]) {
              currentMonthData.categories[catKey] = [...prevMonthData.categories[catKey]]
            }
            // Also copy custom names if they exist
            if (prevMonthData.customNames?.[catKey]) {
              if (!currentMonthData.customNames) currentMonthData.customNames = {}
              currentMonthData.customNames[catKey] = prevMonthData.customNames[catKey]
            }
          }
        })
      }
    })
    renderApp()
    showToast("הוצאות קבועות והלוואות הועתקו מחודש קודם.")
  } catch (error) {
    console.error("Error copying fixed expenses:", error)
    showToast("שגיאה בהעתקת הוצאות קבועות")
  }
}

// Copy taxes from previous month
function copyTaxes() {
  try {
    const prevMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1
    const prevYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear
    ensureDataStructure(prevYear, prevMonthIndex)
    const prevMonthData = cashflowData.years[prevYear][prevMonthIndex]
    const currentMonthData = cashflowData.years[currentYear][currentMonthIndex]
    const businessType = cashflowData.vatSettings?.businessType

    // Copy data for "Payments and Taxes" group, excluding calculated VAT fields
    if (userCategories["תשלומים ומיסים"] && userCategories["תשלומים ומיסים"].items) {
      Object.keys(userCategories["תשלומים ומיסים"].items).forEach((catKey) => {
        const catDetails = userCategories["תשלומים ומיסים"].items[catKey]
        // Copy only if category is relevant to current business type
        if (!catDetails.businessTypes || catDetails.businessTypes.includes(businessType)) {
          if (catKey !== "vat_field" && catKey !== "vat_payment" && prevMonthData.categories[catKey]) {
            currentMonthData.categories[catKey] = [...prevMonthData.categories[catKey]]
          }
          // Also copy custom names if they exist
          if (prevMonthData.customNames?.[catKey]) {
            if (!currentMonthData.customNames) currentMonthData.customNames = {}
            currentMonthData.customNames[catKey] = prevMonthData.customNames[catKey]
          }
        }
      })
    }
    renderApp()
    showToast("תשלומים ומיסים הועתקו מחודש קודם.")
  } catch (error) {
    console.error("Error copying taxes:", error)
    showToast("שגיאה בהעתקת מיסים")
  }
}

// Copy custom titles only (no amounts)
function copyTitlesOnly() {
  try {
    const prevMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1
    const prevYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear
    ensureDataStructure(prevYear, prevMonthIndex)
    const prevMonthData = cashflowData.years[prevYear][prevMonthIndex]
    const currentMonthData = cashflowData.years[currentYear][currentMonthIndex]

    // Copy only custom names
    if (prevMonthData.customNames) {
      if (!currentMonthData.customNames) currentMonthData.customNames = {}
      Object.keys(prevMonthData.customNames).forEach((catKey) => {
        if (prevMonthData.customNames[catKey]) {
          currentMonthData.customNames[catKey] = prevMonthData.customNames[catKey]
        }
      })
    }
    renderApp()
    showToast("כותרות הועתקו מחודש קודם (ללא סכומים).")
  } catch (error) {
    console.error("Error copying titles:", error)
    showToast("שגיאה בהעתקת כותרות")
  }
}

// Scroll to today's date
function scrollToToday() {
  try {
    const today = new Date()
    currentYear = today.getFullYear()
    currentMonthIndex = today.getMonth()
    selectedDay = today.getDate() - 1
    renderApp()
    // Scroll table to today's column
    setTimeout(() => {
      const tableContainerRef = document.getElementById("table-container")
      if (tableContainerRef) {
        const todayColumn = tableContainerRef.querySelector(`th.today-header`)
        if (todayColumn) {
          todayColumn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
        }
      }
    }, 200)
  } catch (error) {
    console.error("Error scrolling to today:", error)
  }
}

// Generate print summary / PDF
function generatePrintSummary() {
  try {
    ensureDataStructure(currentYear, currentMonthIndex)
    const monthData = cashflowData.years[currentYear][currentMonthIndex].categories
    const customNames = cashflowData.years[currentYear][currentMonthIndex].customNames || {}
    const businessType = cashflowData.vatSettings?.businessType

    const openingBalance = getMonthlyOpeningBalance()
    const totalIncome = getMonthlyTotal("income")
    const totalExpenses = getMonthlyTotal("expense")
    const monthlyBalance = totalIncome - totalExpenses
    const clientName = cashflowData.clientName || "&nbsp;"

    let html = `
          <div style="font-family: 'Inter', Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; max-width: 800px; margin: auto; color: #334155;">
              <h1 style="text-align: center; margin-bottom: 20px; color: #1e40af;">דוח תזרים מזומנים - ${months[currentMonthIndex]} ${currentYear}</h1>
              <p style="text-align: center; margin-bottom: 10px; font-size: 18px; font-weight: bold;">${clientName}</p>
              <p style="text-align: center; margin-bottom: 30px; font-size: 12px; color: #666;">הופק בתאריך: ${new Date().toLocaleDateString("he-IL")}</p>
              
              <h2 style="background-color: #3b82f6; color: white; padding: 10px; margin-top: 20px; margin-bottom: 10px; border-radius: 4px;">סיכום מנהלים</h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr style="background-color: #f8fafc;"><td style="border: 1px solid #e2e8f0; padding: 12px; font-weight: bold; width: 60%;">יתרת פתיחה לחודש</td><td style="border: 1px solid #e2e8f0; padding: 12px; font-size: 16px; font-weight: bold;">${formatCurrency(openingBalance)}</td></tr>
                  <tr style="background-color: #f0fdf4;"><td style="border: 1px solid #e2e8f0; padding: 12px; font-weight: bold; color: #15803d;">סה"כ הכנסות חודשי</td><td style="border: 1px solid #e2e8f0; padding: 12px; color: #15803d; font-size: 16px; font-weight: bold;">${formatCurrency(totalIncome)}</td></tr>
                  <tr style="background-color: #fef2f2;"><td style="border: 1px solid #e2e8f0; padding: 12px; font-weight: bold; color: #dc2626;">סה"כ הוצאות חודשי</td><td style="border: 1px solid #e2e8f0; padding: 12px; font-size: 16px; font-weight: bold; color: #dc2626;">${formatCurrency(totalExpenses)}</td></tr>
                  <tr style="background-color: #f1f5f9;"><td style="border: 1px solid #e2e8f0; padding: 12px; font-weight: bold;">מאזן צפוי חודשי</td><td style="border: 1px solid #e2e8f0; padding: 12px; font-size: 18px; font-weight: bold; color: ${monthlyBalance >= 0 ? "#15803d" : "#dc2626"};">${formatCurrency(monthlyBalance)}</td></tr>
                  <tr style="background-color: #dbeafe; border: 2px solid #3b82f6;"><td style="border: 1px solid #e2e8f0; padding: 15px; font-weight: bold; font-size: 16px;">יתרת סגירה צפויה</td><td style="border: 1px solid #e2e8f0; padding: 15px; font-size: 20px; font-weight: bold; color: ${(openingBalance + monthlyBalance) >= 0 ? "#15803d" : "#dc2626"};">${formatCurrency(openingBalance + monthlyBalance)}</td></tr>
              </table>

              <h2 style="background-color: #059669; color: white; padding: 10px; margin-top: 30px; margin-bottom: 10px; border-radius: 4px;">פירוט הכנסות והוצאות</h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #ccc;">
                  <thead>
                      <tr style="background-color: #f2f2f2;">
                          <th style="border: 1px solid #ccc; padding: 10px; font-weight: bold; text-align: right;">תיאור</th>
                          <th style="border: 1px solid #ccc; padding: 10px; font-weight: bold; text-align: center;">סה"כ</th>
                      </tr>
                  </thead>
                  <tbody>`

    // Loop through category groups to display details
    Object.entries(userCategories).forEach(([groupName, groupDetails]) => {
      let groupTotal = 0
      let groupItemRows = ""
      let hasContent = false // Flag to check if group has data

      Object.entries(groupDetails.items).forEach(([catKey, catDetails]) => {
        // Skip specific fields not relevant to current business type
        if (catDetails.businessTypes && !catDetails.businessTypes.includes(businessType)) {
          return
        }

        const sum = (cashflowData.years[currentYear][currentMonthIndex].categories[catKey] || []).reduce(
          (acc, val) => acc + (Number.parseFloat(val) || 0),
          0,
        )
        groupTotal += sum
        if (sum !== 0) {
          hasContent = true
          const displayName = catDetails.name || customNames[catKey] || catDetails.placeholder || "ללא שם"
          groupItemRows += `<tr>
                                          <td style="border-bottom: 1px solid #eee; padding: 8px 8px 8px 25px;">${displayName}</td>
                                          <td style="border-bottom: 1px solid #eee; padding: 8px; text-align: center;">${formatCurrency(sum)}</td>
                                        </tr>`
        }
      })

      // If group has content, display group header and rows
      if (hasContent) {
        html += `<tr><td colspan="2" style="border-top: 2px solid #333; border-bottom: 1px solid #ccc; padding: 10px; font-weight: bold; font-size: 14px; background-color: ${groupDetails.hex}; color: ${isLightColor(groupDetails.hex) ? '#1f2937' : 'white'};">${groupName}</td></tr>` // Dynamic text color
        html += groupItemRows
        html += `<tr style="font-weight: bold; background-color: #f0f0f0;">
                              <td style="border-top: 1px solid #ccc; padding: 10px;">סיכום ${groupName}</td>
                              <td style="border-top: 1px solid #ccc; padding: 10px; text-align: center; font-size: 14px;">${formatCurrency(groupTotal)}</td>
                           </tr>`
      }
    })

    html += `</tbody></table></div>`

    // Open new window with content for printing
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(
        `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>דוח תזרים מזומנים - ${months[currentMonthIndex]} ${currentYear}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet"><style>body{font-family: 'Inter', Arial, sans-serif; margin: 20px; line-height: 1.4; color: #374151;} table{page-break-inside: avoid;} h1, h2{page-break-after: avoid;} @media print { body{margin:0; -webkit-print-color-adjust: exact; print-color-adjust: exact;} table{font-size:11px;} h1{font-size:24px;} h2{font-size:16px;} }</style></head><body>${html}</body></html>`,
      )
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => printWindow.print(), 500)
    }
  } catch (error) {
    console.error("Error generating print summary:", error)
    showToast("שגיאה ביצירת הדוח")
  }
}

// Helper function to determine if a hex color is light or dark
function isLightColor(hex) {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    // Using the YIQ formula to determine brightness
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128;
}

// Find cashflow gaps manually
function findCashflowGapsManually() {
  try {
    const bankLimit = Number.parseFloat(String(cashflowData.bankLimit || "0").replace(/,/g, ""))
    if (bankLimit <= 0) {
      showCustomAlert("אנא הגדר מסגרת בנק חיובית כדי לזהות פערי תזרים.")
      return
    }

    const gaps = []
    const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex)
    const monthData = cashflowData.years[currentYear][currentMonthIndex].categories
    const openingBalanceForMonth = getMonthlyOpeningBalance()
    let runningBalance = openingBalanceForMonth
    const businessType = cashflowData.vatSettings?.businessType

    for (let day = 0; day < daysInMonth; day++) {
      let dailyIncome = 0,
        dailyExpense = 0
      Object.values(userCategories).forEach((group) => {
        Object.entries(group.items).forEach(([catKey, catDetails]) => {
          // Skip specific fields not relevant to current business type
          if (catDetails.businessTypes && !catDetails.businessTypes.includes(businessType)) {
            return
          }

          const value = Number.parseFloat(monthData[catKey]?.[day] || 0)
          if (catDetails.type === "income" || catDetails.type === "exempt_income") dailyIncome += value
          else if (
            catDetails.type.startsWith("expense") ||
            catDetails.type === "employee_cost" ||
            catDetails.type.startsWith("partial_vat_expense") ||
            catDetails.type === "expense_no_vat"
          )
            dailyExpense += value
        })
      })

      if (monthData["vat_payment"]) {
        dailyExpense += Number.parseFloat(monthData["vat_payment"][day] || 0)
      }

      const dailyNet = dailyIncome - dailyExpense
      runningBalance += dailyNet

      if (runningBalance < -bankLimit) {
        gaps.push({
          day: day + 1,
          balance: runningBalance,
          shortage: Math.abs(runningBalance + bankLimit),
        })
      }
    }

    if (gaps.length === 0) {
      showCustomAlert("לא נמצאו פערי תזרים בחודש זה 👍")
    } else {
      let message = `נמצאו ${gaps.length} ימים עם פער תזרימי:<br><br>`
      gaps.forEach((gap) => {
        message += `<b>יום ${gap.day}:</b> יתרה ${formatCurrency(gap.balance)} (חריגה של: ${formatCurrency(gap.shortage)})<br>`
      })
      showCustomAlert(message)
    }
  } catch (error) {
    console.error("Error finding cashflow gaps:", error)
    showToast("שגיאה בחיפוש פערי תזרים")
  }
}

// Update cashflow gap alerts on table column headers
function updateDailyGapAlerts(gapDays) {
  // Remove all existing alert icons
  document.querySelectorAll(".gap-alert-icon").forEach((icon) => icon.remove())

  // If auto alerts are off, do not display icons
  if (!(cashflowData.settings?.autoAlerts ?? true)) {
    return
  }

  const headerCells = document.querySelectorAll("#table-head th:not(.category-header)")
  gapDays.forEach((dayIndex) => {
    if (headerCells[dayIndex]) {
      const alertIcon = document.createElement("span")
      alertIcon.className = "gap-alert-icon"
      alertIcon.textContent = "!"
      alertIcon.title = "אזהרה: צפויה חריגה ממסגרת הבנק ביום זה."
      headerCells[dayIndex].prepend(alertIcon)
    }
  })
}

// --- Functions for category management in settings ---

// Open category editor modal
editCategoriesBtn.addEventListener("click", () => {
  settingsModal.classList.add("hidden"); // Close main settings modal
  categoryEditorModal.classList.remove("hidden")
  renderCategoryEditor()
})

// Close category editor modal
cancelCategoryEditBtn.addEventListener("click", () => {
  categoryEditorModal.classList.add("hidden")
  settingsModal.classList.remove("hidden"); // Re-open main settings modal
})

// Save category changes
saveCategoryChangesBtn.addEventListener("click", async () => {
  const confirmed = await showCustomConfirm("האם אתה בטוח שברצונך לשמור את השינויים בקטגוריות?")
  if (!confirmed) {
    return
  }

  try {
    // Save category changes
    await saveData()
    categoryEditorModal.classList.add("hidden")
    showToast("השינויים בקטגוריות נשמרו בהצלחה!")
    renderApp() // Re-render app to display changes
    settingsModal.classList.remove("hidden"); // Re-open main settings modal
  } catch (error) {
    console.error("Error saving category changes:", error)
    showToast("שגיאה בשמירת השינויים בקטגוריות")
  }
})

// Function to render category editor
function renderCategoryEditor() {
  try {
    categoryEditorContainer.innerHTML = "" // Clear container
    const businessType = cashflowData.vatSettings?.businessType

    // Loop through category groups
    Object.entries(userCategories).forEach(([groupName, groupDetails]) => {
      // Skip groups not relevant to business type or hidden
      if (groupName === "הכנסות פטורות ממע'מ" && !cashflowData.vatSettings?.hasExemptIncome) return
      if (groupDetails.vatRelated && businessType === "exempt") return

      const groupDiv = document.createElement("div")
      groupDiv.className = "border p-3 rounded-lg bg-slate-700 shadow-inner" // Updated styling

      const groupHeader = document.createElement("h5")
      groupHeader.textContent = groupName
      groupHeader.className = "font-bold text-md mb-3 text-white" // Updated text color
      groupDiv.appendChild(groupHeader)

      const itemsContainer = document.createElement("div")
      itemsContainer.className = "space-y-2"

      // Loop through category items within the group
      Object.entries(groupDetails.items).forEach(([catKey, catDetails]) => {
        // Skip specific fields not relevant to current business type
        if (catDetails.businessTypes && !catDetails.businessTypes.includes(businessType)) {
          return
        }

        const itemDiv = document.createElement("div")
        itemDiv.className = "flex items-center gap-2"

        const nameInput = document.createElement("input")
        nameInput.type = "text"
        nameInput.value = catDetails.name || ""
        nameInput.placeholder = catDetails.placeholder || "שם קטגוריה"
        nameInput.className = "w-full px-2 py-1 border rounded text-sm category-setting-input bg-slate-600 border-slate-500 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" // Updated styling
        nameInput.dataset.groupName = groupName
        nameInput.dataset.catKey = catKey
        
        nameInput.addEventListener("input", (e) => {
            const currentGroup = e.target.dataset.groupName;
            const currentKey = e.target.dataset.catKey;
            // Update name in the main userCategories object
            userCategories[currentGroup].items[currentKey].name = e.target.value;
            // Also update the custom name for the current month to reflect immediately
            if (!cashflowData.years[currentYear][currentMonthIndex].customNames) {
                cashflowData.years[currentYear][currentMonthIndex].customNames = {};
            }
            cashflowData.years[currentYear][currentMonthIndex].customNames[currentKey] = e.target.value;
        });
        
        itemDiv.appendChild(nameInput)

        // FINAL FIX: Allow deleting ALL rows, regardless of 'fixed' property
        const deleteButton = document.createElement("button")
        deleteButton.textContent = "X"
        deleteButton.className = "bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors duration-200" // Updated styling
        deleteButton.addEventListener("click", async () => {
        const confirmed = await showCustomConfirm(
            `האם אתה בטוח שברצונך למחוק את השורה "${catDetails.name || catDetails.placeholder}"? פעולה זו תמחק את כל הנתונים הקשורים לשורה זו בכל החודשים והשנים.`,
        )
        if (!confirmed) {
            return
        }

        // Delete category
        delete userCategories[groupName].items[catKey]
        // Remove data related to this row from all months and years
        for (const yearKey in cashflowData.years) {
            for (const monthIndex in cashflowData.years[yearKey]) {
            if (cashflowData.years[yearKey][monthIndex].categories[catKey]) {
                delete cashflowData.years[yearKey][monthIndex].categories[catKey]
            }
            if (cashflowData.years[yearKey][monthIndex].customNames?.[catKey]) {
                delete cashflowData.years[yearKey][monthIndex].customNames[catKey]
            }
            }
        }
        renderCategoryEditor() // Re-render editor
        renderApp() // Re-render main app
        showToast("השורה נמחקה בהצלחה!")
        })
        itemDiv.appendChild(deleteButton)
        

        itemsContainer.appendChild(itemDiv)
      })

      // Button to add new category
      const addButton = document.createElement("button")
      addButton.textContent = "+ הוסף שורה חדשה"
      addButton.className = "w-full mt-3 bg-blue-600 text-white py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200" // Updated styling
      addButton.addEventListener("click", () => {
        let newCatKeyPrefix
        let newCatType
        let newCatPlaceholder

        if (groupName === "ספקים") {
          newCatKeyPrefix = "supplier_new_"
          newCatType = "expense"
          newCatPlaceholder = "ספק חדש"
        } else if (groupName === "הוצאות משתנות") {
          newCatKeyPrefix = "custom_var_new_"
          newCatType = "expense"
          newCatPlaceholder = "הוצאה משתנה חדשה"
        } else if (groupName === "הלוואות") {
          newCatKeyPrefix = "loan_new_"
          newCatType = "expense_no_vat"
          newCatPlaceholder = "הלוואה חדשה"
        } else if (groupName === "הוצאות קבועות") {
          newCatKeyPrefix = "custom_fixed_new_"
          newCatType = "expense"
          newCatPlaceholder = "הוצאה קבועה חדשה"
        } else if (groupName === "תשלומים ומיסים") {
          newCatKeyPrefix = "custom_tax_new_"
          newCatType = "expense"
          newCatPlaceholder = "מס נוסף חדש"
        } else if (groupName === "הכנסות") {
          newCatKeyPrefix = "income_new_"
          newCatType = "income"
          newCatPlaceholder = "הכנסה חדשה"
        } else if (groupName === "הכנסות פטורות ממע'מ") {
          newCatKeyPrefix = "exempt_income_new_"
          newCatType = "exempt_income"
          newCatPlaceholder = "הכנסה פטורה חדשה"
        } else if (groupName === "הוצאות עם הכרה חלקית במע'מ") {
          newCatKeyPrefix = "partial_custom_new_"
          newCatType = "partial_vat_expense"
          newCatPlaceholder = "הוצאה חלקית חדשה"
        } else {
          showToast("לא ניתן להוסיף שורות לקטגוריה זו.")
          return
        }

        let newIndex = 1
        let newCatKey = newCatKeyPrefix + newIndex
        while (userCategories[groupName].items.hasOwnProperty(newCatKey)) {
          newIndex++
          newCatKey = newCatKeyPrefix + newIndex
        }

        // Add new category to userCategories object
        userCategories[groupName].items[newCatKey] = {
          name: "",
          type: newCatType,
          placeholder: newCatPlaceholder,
        }

        // Ensure data structure is updated for new category in all months
        for (const yearKey in cashflowData.years) {
          for (const monthIndex in cashflowData.years[yearKey]) {
            const daysInMonth = getDaysInMonth(Number(yearKey), Number(monthIndex))
            cashflowData.years[yearKey][monthIndex].categories[newCatKey] = Array(daysInMonth).fill(0)
          }
        }
        renderCategoryEditor() // Re-render editor
      })
      groupDiv.appendChild(itemsContainer)
      groupDiv.appendChild(addButton)
      categoryEditorContainer.appendChild(groupDiv)
    })
  } catch (error) {
    console.error("Error rendering category editor:", error)
  }
}

// --- General Event Listeners ---
document.addEventListener("input", handleInput)
document.getElementById("saveButton").addEventListener("click", saveData)
document.getElementById("header-save-btn").addEventListener("click", saveData)
document.getElementById("printButton").addEventListener("click", generatePrintSummary)
document.getElementById("todayButton").addEventListener("click", scrollToToday)
document.getElementById("todayButtonHeader").addEventListener("click", scrollToToday)
document.getElementById("copyFixedButton").addEventListener("click", copyFixedExpenses)
document.getElementById("copyTaxesButton").addEventListener("click", copyTaxes)
document.getElementById("copyTitlesButton").addEventListener("click", copyTitlesOnly)
document.getElementById("cashflowGapButton").addEventListener("click", findCashflowGapsManually)

// Reset month
document.getElementById("resetButton").addEventListener("click", async () => {
  const confirmed = await showCustomConfirm(
    `האם אתה בטוח שברצונך לאפס את כל הנתונים לחודש ${months[currentMonthIndex]}? הפעולה אינה הפיכה.`,
  )
  if (confirmed) {
    try {
      ensureDataStructure(currentYear, currentMonthIndex)
      const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex)
      // Reset all numerical data for current month
      Object.values(userCategories).forEach((group) => {
        Object.keys(group.items).forEach((catKey) => {
          // Only if category is relevant to current business type
          const businessType = cashflowData.vatSettings?.businessType
          const catDetails = group.items[catKey]
          if (!catDetails.businessTypes || catDetails.businessTypes.includes(businessType)) {
            cashflowData.years[currentYear][currentMonthIndex].categories[catKey] = Array(daysInMonth).fill(0)
          }
        })
      })
      cashflowData.years[currentYear][currentMonthIndex].customNames = {} // Clear custom names too
      renderApp()
      showToast(`נתוני חודש ${months[currentMonthIndex]} אופסו.`)
      if (cashflowData.settings?.autoSave) {
        saveData()
      }
    } catch (error) {
      console.error("Error resetting month:", error)
      showToast("שגיאה באיפוס הנתונים")
    }
  }
})

// Handle input focus (remove commas before editing)
document.addEventListener("focusin", (e) => {
  try {
    if (
      e.target.classList.contains("formatted-number-input") ||
      e.target.id === "openingBalance" ||
      e.target.id === "bankLimit"
    ) {
      if (e.target.value) e.target.value = e.target.value.replace(/,|\s|₪/g, "")
    }
  } catch (error) {
    console.error("Error on focus in:", error)
  }
})

// Handle input focus out (add commas after editing)
document.addEventListener("focusout", (e) => {
  try {
    if (
      e.target.classList.contains("formatted-number-input") ||
      e.target.id === "openingBalance" ||
      e.target.id === "bankLimit"
    ) {
      const value = Number.parseFloat(e.target.value)
      if (!isNaN(value)) {
        e.target.value = formatWithCommas(value)
      } else {
        e.target.value = ""
      }
    }
  } catch (error) {
    console.error("Error on focus out:", error)
  }
})

// Handle business type change in VAT settings modal (show/hide relevant fields)
document.getElementById("business-type").addEventListener("change", function () {
  const vatSettingsSection = document.getElementById("vat-settings-section")
  if (this.value === "exempt") {
    vatSettingsSection.style.display = "none"
  } else {
    vatSettingsSection.style.display = "block"
  }
  // Re-render app to update displayed categories
  renderApp()
})

// Handle auto-save checkbox
autoSaveCheckbox.addEventListener("change", () => {
  if (!cashflowData.settings) cashflowData.settings = {}
  cashflowData.settings.autoSave = autoSaveCheckbox.checked
  saveData()
})

// Handle auto-alerts checkbox
autoAlertsCheckbox.addEventListener("change", () => {
  if (!cashflowData.settings) cashflowData.settings = {}
  cashflowData.settings.autoAlerts = autoAlertsCheckbox.checked
  updateAllCalculations() // Run calculations again to update gap alerts
  saveData()
})

// --- AI Chat Logic ---
aiChatButton.addEventListener("click", () => {
  aiChatWidget.classList.toggle("visible")
})

chatCloseBtn.addEventListener("click", () => {
  aiChatWidget.classList.remove("visible")
})

chatForm.addEventListener("submit", (e) => {
  e.preventDefault()
  const userMessage = chatInput.value.trim()
  if (userMessage) {
    addMessageToChat(userMessage, "user")
    chatInput.value = ""
    getAIResponse(userMessage)
  }
})

function addMessageToChat(text, sender) {
  const messageElement = document.createElement("div")
  messageElement.className = `chat-message ${sender}`
  messageElement.textContent = text
  chatMessages.appendChild(messageElement)
  chatMessages.scrollTop = chatMessages.scrollHeight
}

function showTypingIndicator() {
  const indicator = document.createElement("div")
  indicator.className = "chat-message assistant typing-indicator"
  indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>'
  chatMessages.appendChild(indicator)
  chatMessages.scrollTop = chatMessages.scrollHeight
  return indicator
}

async function getAIResponse(userQuestion) {
  const typingIndicator = showTypingIndicator()
  chatSendBtn.disabled = true

  const knowledgeBase = `
      אתה "עוזר AI" עבור מערכת לניהול תזרים מזומנים בשם "CashFlow Simple".
      המטרה שלך היא לענות על שאלות של משתמשים לגבי תפעול המערכת בצורה ברורה, ידידותית ובעברית.
      להלן המידע על המערכת והתכונות שלה:

      **תכונות כלליות:**
      - המערכת מאפשרת ניהול תזרים מזומנים יומי, חודשי ושנתי.
      - הנתונים נשמרים בענן ומאובטחים על שרתי גוגל.
      - יש אפשרות לשמירה אוטומטית (ניתן להפעיל בהגדרות).
      - המערכת מותאמת למחשב ולנייד.
      - יתרת הסגירה של שנה קודמת עוברת אוטומטית כיתרת פתיחה לשנה הבאה.
      - ניתן לערוך, להוסיף ולמחוק קטגוריות דרך מסך ההגדרות.

      **הסבר על כפתורים ופעולות:**
      - **שמור:** שומר את כל הנתונים שהוזנו בטבלה לבסיס הנתונים.
      - **היום:** מקפיץ את התצוגה לתאריך של היום.
      - **העתק קבועות:** מעתיק את כל הסכומים מהקטגוריות "הוצאות קבועות" ו"הלוואות" מהחודש הקודם לחודש הנוכחי. זה שימושי להוצאות שחוזרות על עצמן כמו שכירות.
      - **העתק מיסים:** מעתיק את הסכומים מהקטגוריה "תשלומים ומיסים" (למעט שדה המע"מ המחושב) מהחודש הקודם.
      - **העתק כותרות:** מעתיק רק את השמות המותאמים אישית שניתנו לשורות (למשל, שמות של ספקים או הלוואות) מהחודש הקודם, ללא הסכומים.
      - **הדפס / PDF:** פותח חלון חדש עם דוח מסודר של החודש הנוכחי, שמוכן להדפסה או לשמירה כקובץ PDF.
      - **אפס חודש:** מוחק את כל הנתונים המספריים שהוזנו בחודש הנוכחי. הפעולה דורשת אישור והיא אינה הפיכה.
      - **בדיקת פער תזרימי:** פותח חלון המציג את כל הימים בחודש שבהם היתרה המתגלגלת צפויה לרדת מתחת למסגרת הבנק שהוגדרה.
      - **הגדרות:** פותח חלון עם הגדרות שונות, כולל הפעלת שמירה אוטומטית, הפעלת התראות תזרים אוטומטיות, שינוי סיסמה, הגדרות מע"מ וניהול קטגוריות.
      - **התראות תזרים אוטומטיות (בהגדרות):** כאשר אפשרות זו מופעלת, יופיע סימן קריאה אדום ליד כל יום בטבלה שבו צפויה חריגה ממסגרת הבנק.

      **הסבר על קטגוריות:**
      - **ניהול קטגוריות:** דרך מסך ההגדרות, ניתן ללחוץ על "ערוך קטגוריות" כדי לפתוח עורך. בעורך ניתן לשנות שמות של שורות קיימות (כמו ספקים או הלוואות), למחוק אותן עם כפתור המינוס, או להוסיף שורות חדשות עם כפתור הפלוס.
      - **תשלומים ומיסים:** תשלומים לרשויות. שדה "תשלום מע"מ" מחושב אוטומטית על בסיס הדיווח מהחודש/חודשיים הקודמים, בהתאם להגדרות המע"מ.

      **הנחיות כלליות למענה:**
      - תמיד תענה בעברית.
      - שמור על טון ידידותי ומסייע.
      - אם אתה לא יודע את התשובה, אמור שאין לך מידע על כך והצע למשתמש לפנות לתמיכה במייל.
      - השתמש במידע שניתן לך כאן כדי לבסס את התשובות שלך.
  `

  const prompt = `${knowledgeBase}\n\nהמשתמש שואל: ${userQuestion}`

  chatHistory.push({ role: "user", parts: [{ text: prompt }] })

  try {
    const payload = { contents: chatHistory }
    // *** API KEY ADDED HERE ***
    const apiKey = "AIzaSyCGKg80c3mOzLV2xraaNeOY_IC5HlK6dZI" 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json();
      console.error("AI API Error:", errorData);
      throw new Error(`שגיאת רשת: ${response.statusText}. פרטים: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json()

    let aiResponse = "מצטער, לא הצלחתי לעבד את הבקשה כרגע."
    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      aiResponse = result.candidates[0].content.parts[0].text
      chatHistory.push({ role: "model", parts: [{ text: aiResponse }] })
    }

    chatMessages.removeChild(typingIndicator)
    addMessageToChat(aiResponse, "assistant")
  } catch (error) {
    console.error("Error fetching AI response:", error)
    chatMessages.removeChild(typingIndicator)
    addMessageToChat("אופס, נתקלתי בשגיאה. אנא ודא שמפתח ה-API שלך הוגדר כראוי ב-Google Cloud ושה-Generative Language API מופעל. אם הבעיה ממשיכה, פנה לתמיכה.", "assistant")
  } finally {
    chatSendBtn.disabled = false
  }
}

// --- Fullscreen Feature Listener (with scroll restoration) ---
let savedScrollPosition = { top: 0, left: 0 }; // Variable to store scroll position

if (toggleFullscreenBtn && mainTableContainer && expandIcon && collapseIcon) {
  toggleFullscreenBtn.addEventListener('click', () => {
    const tableContainer = document.getElementById('table-container');
    if (!tableContainer) return;

    const isFullscreen = mainTableContainer.classList.toggle('fullscreen');
    document.body.classList.toggle('fullscreen-active');

    if (isFullscreen) {
      // Save scroll position before entering fullscreen
      savedScrollPosition = {
        top: tableContainer.scrollTop,
        left: tableContainer.scrollLeft,
      };

      expandIcon.classList.add('hidden');
      collapseIcon.classList.remove('hidden');
      toggleFullscreenBtn.setAttribute('title', 'צא ממסך מלא');
    } else {
      // Restore scroll position after exiting fullscreen
      expandIcon.classList.remove('hidden');
      collapseIcon.classList.add('hidden');
      toggleFullscreenBtn.setAttribute('title', 'הצג מסך מלא');

      // Use setTimeout to allow the DOM to update before restoring scroll
      setTimeout(() => {
        tableContainer.scrollTop = savedScrollPosition.top;
        tableContainer.scrollLeft = savedScrollPosition.left;
      }, 0);
    }
  });
}

// Prevent browser back/forward on horizontal scroll
document.addEventListener('DOMContentLoaded', () => {
    const tableContainerForScroll = document.getElementById('table-container');
    if (tableContainerForScroll) {
        tableContainerForScroll.addEventListener('wheel', (e) => {
            // Only interfere if the horizontal scroll is significant
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                // And if the container is actually scrollable horizontally
                if (tableContainerForScroll.scrollWidth > tableContainerForScroll.clientWidth) {
                    e.preventDefault();
                    // Apply the scroll manually
                    tableContainerForScroll.scrollLeft += e.deltaX;
                }
            }
        }, { passive: false });
    }

    // Initialize theme based on user preference or default to dark
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        // Default to dark theme if no preference or 'dark' is saved
        document.body.classList.remove('light-theme');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
});

// Theme Toggle Logic
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');

    if (isLight) {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
});
