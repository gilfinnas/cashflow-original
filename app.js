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

// --- CORRECTED FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyBv4duy17y72b22VtBxisXztEylSFuK1jU",
  authDomain: "gilfinnasnew.firebaseapp.com",
  projectId: "gilfinnasnew",
  storageBucket: "gilfinnasnew.firebasestorage.app",
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
const defaultCategories = {
  הכנסות: {
    color: "header-income",
    hex: "#c6f6d5",
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
    hex: "#c6f6d5",
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
    hex: "#FEEBC8",
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
    hex: "#fed7d7",
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
    hex: "#fed7d7",
    items: {
      car_expenses: { name: "הוצאות רכב", type: "partial_vat_expense", vatRate: 0.67, fixed: true },
      phone_expenses: { name: "טלפון נייד", type: "partial_vat_expense", vatRate: 0.5, fixed: true },
      partial_custom_1: { name: "", type: "partial_vat_expense", vatRate: 0.67, placeholder: "הוצאה עם הכרה חלקית 1" },
      partial_custom_2: { name: "", type: "partial_vat_expense", vatRate: 0.67, placeholder: "הוצאה עם הכרה חלקית 2" },
    },
  },
  הלוואות: {
    color: "header-loans",
    hex: "#BEE3F8",
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
    hex: "#E9D8FD",
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
    hex: "#c3dafe",
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
    hex: "#e2e8f0",
    items: { misc: { name: 'שונות / בלת"מ', type: "expense", fixed: true } },
  },
}

// Global variables
let userCategories = {}
let cashflowData = {}
let currentUser = null
let currentYear = new Date().getFullYear()
let currentMonthIndex = new Date().getMonth()
let selectedDay = new Date().getDate() - 1
let recaptchaVerifier = null
let confirmationResult = null
let updateTimeout = null
let dbListenerUnsubscribe = null

// Theme management
let currentTheme = localStorage.getItem("theme") || "light"
const themeToggle = document.getElementById("theme-toggle")

// Initialize theme on page load
function initializeTheme() {
  document.documentElement.setAttribute("data-theme", currentTheme)
  updateThemeIcon()
}

// Update theme icon based on current theme
function updateThemeIcon() {
  const sunIcon = document.querySelector(".theme-icon.sun")
  const moonIcon = document.querySelector(".theme-icon.moon")

  if (currentTheme === "dark") {
    themeToggle.title = "החלף למצב בהיר"
  } else {
    themeToggle.title = "החלף למצב כהה"
  }
}

// Toggle theme function
function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light"
  document.documentElement.setAttribute("data-theme", currentTheme)
  localStorage.setItem("theme", currentTheme)
  updateThemeIcon()

  // Show toast notification
  const themeText = currentTheme === "dark" ? "מצב כהה" : "מצב בהיר"
  const themeIcon = currentTheme === "dark" ? "🌙" : "☀️"
  showToast(`${themeIcon} עברת ל${themeText}`)
}

// Add theme toggle event listener
themeToggle.addEventListener("click", toggleTheme)

// Initialize theme when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeTheme)

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

const editCategoriesBtn = document.getElementById("edit-categories-btn")
const categoryEditorModal = document.getElementById("category-editor-modal")
const categoryEditorContainer = document.getElementById("category-editor-container")
const saveCategoryChangesBtn = document.getElementById("save-category-changes")
const cancelCategoryEditBtn = document.getElementById("cancel-category-edit")

const toggleFullscreenBtn = document.getElementById("toggle-fullscreen-btn")
const mainTableContainer = document.querySelector(".main-table-container")
const expandIcon = document.getElementById("expand-icon")
const collapseIcon = document.getElementById("collapse-icon")

// Custom alert function
function showCustomAlert(message) {
  customAlertBody.innerHTML = message
  customAlertModal.classList.remove("hidden")
  customAlertOkBtn.onclick = () => {
    customAlertModal.classList.add("hidden")
  }
}

// Custom confirm function
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

// Support button scroll logic
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

// Table scroll functions
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

// Banner button events
bannerButton.addEventListener("click", () => {
  window.open("offer.html", "_blank")
})

upgradeNowBtn.addEventListener("click", () => {
  window.open("offer.html", "_blank")
})

// VAT settings save
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

// Edit VAT settings from main settings modal
document.getElementById("edit-vat-settings").addEventListener("click", () => {
  if (cashflowData.vatSettings) {
    document.getElementById("business-type").value = cashflowData.vatSettings.businessType || "company"
    document.getElementById("vat-frequency").value = cashflowData.vatSettings.frequency || "monthly"
    document.getElementById("vat-payment-day").value = cashflowData.vatSettings.paymentDay || 15
    document.getElementById("has-exempt-income").value = cashflowData.vatSettings.hasExemptIncome ? "yes" : "no"
  }
  settingsModal.classList.add("hidden")
  vatSetupModal.classList.remove("hidden")
})

// Firebase auth state listener
onAuthStateChanged(auth, (user) => {
  if (dbListenerUnsubscribe) {
    dbListenerUnsubscribe()
  }

  if (user) {
    currentUser = user

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

    dbListenerUnsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        loader.classList.remove("hidden")
        try {
          const userData = docSnap.exists() ? docSnap.data() : null

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
              categories: defaultCategories,
            }

            await setDoc(docRef, initialData, { merge: true })
            showToast("ברוכים הבאים! קיבלת 14 ימי ניסיון חינם 🎉")
            setTimeout(() => {
              vatSetupModal.classList.remove("hidden")
            }, 1500)
            return
          }

          if (docSnap.exists()) {
            const updates = {}
            if (!userData.hasOwnProperty("transactions")) {
              updates.transactions = []
            }
            if (!userData.hasOwnProperty("categories") || Object.keys(userData.categories).length === 0) {
              updates.categories = defaultCategories
            }

            if (Object.keys(updates).length > 0) {
              console.log("Existing user is missing fields. Updating document...")
              await updateDoc(docRef, updates)
              return
            }
          }

          if (userData.categories) {
            const userCats = userData.categories
            let needsUpdate = false
            Object.keys(defaultCategories).forEach((groupName) => {
              if (userCats[groupName] && defaultCategories[groupName]) {
                Object.keys(defaultCategories[groupName].items).forEach((itemKey) => {
                  const defaultItem = defaultCategories[groupName].items[itemKey]
                  if (userCats[groupName].items[itemKey]) {
                    const userItem = userCats[groupName].items[itemKey]
                    Object.keys(defaultItem).forEach((prop) => {
                      if (!userItem.hasOwnProperty(prop)) {
                        userItem[prop] = defaultItem[prop]
                        needsUpdate = true
                      }
                    })
                  }
                })
              }
            })

            if (needsUpdate) {
              console.log("Patching user categories with new properties...")
              await updateDoc(docRef, { categories: userCats })
              return
            }
          }

          userCategories = userData.categories || defaultCategories
          const orderedUserCategories = {}
          Object.keys(defaultCategories).forEach((groupName) => {
            if (userCategories[groupName]) {
              orderedUserCategories[groupName] = { ...userCategories[groupName] }
              const orderedItems = {}
              Object.keys(defaultCategories[groupName].items).forEach((itemKey) => {
                if (userCategories[groupName].items[itemKey]) {
                  orderedItems[itemKey] = userCategories[groupName].items[itemKey]
                }
              })
              Object.keys(userCategories[groupName].items).forEach((itemKey) => {
                if (!orderedItems[itemKey]) {
                  orderedItems[itemKey] = userCategories[groupName].items[itemKey]
                }
              })
              orderedUserCategories[groupName].items = orderedItems
            } else {
              orderedUserCategories[groupName] = { ...defaultCategories[groupName] }
            }
          })
          Object.keys(userCategories).forEach((groupName) => {
            if (!orderedUserCategories[groupName]) {
              orderedUserCategories[groupName] = userCategories[groupName]
            }
          })
          userCategories = orderedUserCategories

          cashflowData = {
            clientName: userData.clientName || user.email,
            openingBalance: userData.openingBalance || 10000,
            years: userData.years || {},
            settings: userData.settings || { autoSave: false, autoAlerts: true },
            subscriptionEndDate: userData.subscriptionEndDate,
            subscriptionType: userData.subscriptionType || "trial",
            vatSettings: userData.vatSettings || null,
            phoneNumber: userData.phoneNumber || null,
            transactions: userData.transactions || [],
          }

          const now = new Date()
          const subscriptionEnd = userData.subscriptionEndDate.toDate()
          const isExpired = now > subscriptionEnd
          const daysLeft = Math.ceil((subscriptionEnd - now) / (1000 * 60 * 60 * 24))

          if (isExpired) {
            subscriptionModal.classList.remove("hidden")
            return
          } else if (daysLeft <= 3 && userData.subscriptionType === "trial") {
            subscriptionBanner.classList.remove("hidden")
            subscriptionBanner.className = "subscription-banner trial"
            bannerText.textContent = `נותרו ${daysLeft} ימים לתקופת הניסיון שלכם`
          } else if (daysLeft <= 7 && userData.subscriptionType === "active") {
            subscriptionBanner.classList.remove("hidden")
            subscriptionBanner.className = "subscription-banner active"
            bannerText.textContent = `המנוי שלכם יפוג בעוד ${daysLeft} ימים`
          } else {
            subscriptionBanner.classList.add("hidden")
          }

          autoSaveCheckbox.checked = cashflowData.settings.autoSave
          autoAlertsCheckbox.checked = cashflowData.settings.autoAlerts

          if (cashflowData.phoneNumber) {
            phoneNumberDisplay.classList.remove("hidden")
            verifiedPhoneSpan.textContent = cashflowData.phoneNumber
            remove2faBtn.classList.remove("hidden")
            sendVerificationBtn.textContent = "שנה מספר טלפון"
          }

          loader.classList.add("hidden")
          authContainer.classList.add("hidden")
          appContainer.classList.remove("hidden")

          if (!cashflowData.vatSettings) {
            setTimeout(() => {
              vatSetupModal.classList.remove("hidden")
            }, 1000)
          }

          renderApp()
        } catch (error) {
          console.error("Error loading user data:", error)
          loader.classList.add("hidden")
          showToast("שגיאה בטעינת נתוני המשתמש")
        }
      },
      (error) => {
        console.error("Error listening to user data:", error)
        loader.classList.add("hidden")
        showToast("שגיאה בחיבור לבסיס הנתונים")
      },
    )
  } else {
    currentUser = null
    loader.classList.add("hidden")
    authContainer.classList.remove("hidden")
    appContainer.classList.add("hidden")
  }
})

// Main app render function
function renderApp() {
  // Initialize theme
  initializeTheme()

  // עדכן תצוגת השנה הנוכחית
  currentYearDisplay.textContent = currentYear

  const clientNameInput = document.getElementById("clientName")
  clientNameInput.value = cashflowData.clientName

  const openingBalanceInput = document.getElementById("openingBalance")
  openingBalanceInput.value = formatNumber(cashflowData.openingBalance)

  renderMonthTabs()
  renderTable()
  renderMobileView()
  updateDashboard()

  const today = new Date()
  const todayString = `${today.getDate()}/${today.getMonth() + 1}`
  document.getElementById("todayDateDisplay").textContent = todayString

  setupYearNavigation()
  setupAutoSave()
  setupEventListeners()
}

// Render month tabs
function renderMonthTabs() {
  const monthTabs = document.getElementById("month-tabs")
  monthTabs.innerHTML = ""

  months.forEach((month, index) => {
    const tab = document.createElement("button")
    tab.className = `month-tab ${index === currentMonthIndex ? "active" : ""}`
    tab.textContent = month
    tab.onclick = () => {
      currentMonthIndex = index
      renderApp()
    }
    monthTabs.appendChild(tab)
  })
}

// Render main table
function renderTable() {
  const tableHead = document.getElementById("table-head")
  const tableBody = document.getElementById("table-body")
  const tableFoot = document.getElementById("table-foot")

  tableHead.innerHTML = ""
  tableBody.innerHTML = ""
  tableFoot.innerHTML = ""

  const headerRow = document.createElement("tr")
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const th = document.createElement("th")
    th.textContent = day
    th.className = "day-selector-header"

    const today = new Date()
    if (currentYear === today.getFullYear() && currentMonthIndex === today.getMonth() && day === today.getDate()) {
      th.className += " today-header"
    }

    headerRow.appendChild(th)
  }

  const categoryHeader = document.createElement("th")
  categoryHeader.textContent = "קטגוריה"
  categoryHeader.className = "category-header"
  headerRow.appendChild(categoryHeader)

  tableHead.appendChild(headerRow)

  const totalIncomeRow = Array(daysInMonth).fill(0)
  const totalExpenseRow = Array(daysInMonth).fill(0)
  const balanceRow = Array(daysInMonth).fill(0)

  Object.keys(userCategories).forEach((groupName) => {
    const group = userCategories[groupName]

    if (group.hidden && (!cashflowData.vatSettings || !cashflowData.vatSettings.hasExemptIncome)) {
      return
    }

    const groupHeaderRow = document.createElement("tr")
    groupHeaderRow.className = `group-header-row ${group.color}`

    for (let day = 1; day <= daysInMonth; day++) {
      const td = document.createElement("td")
      groupHeaderRow.appendChild(td)
    }

    const groupNameTd = document.createElement("td")
    groupNameTd.textContent = groupName
    groupNameTd.className = "group-name-cell"
    groupHeaderRow.appendChild(groupNameTd)

    tableBody.appendChild(groupHeaderRow)

    const groupTotalRow = Array(daysInMonth).fill(0)

    Object.keys(group.items).forEach((itemKey) => {
      const item = group.items[itemKey]

      if (item.businessTypes && cashflowData.vatSettings) {
        if (!item.businessTypes.includes(cashflowData.vatSettings.businessType)) {
          return
        }
      }

      const row = document.createElement("tr")
      row.className = "data-row"

      for (let day = 1; day <= daysInMonth; day++) {
        const td = document.createElement("td")
        const input = document.createElement("input")
        input.type = "text"
        input.inputMode = "decimal"
        input.className = "table-cell-input formatted-number-input"

        const monthKey = `${currentYear}-${currentMonthIndex + 1}`
        const dayKey = `day-${day}`
        const existingValue = cashflowData.years[monthKey]?.[itemKey]?.[dayKey] || 0
        input.value = existingValue ? formatNumber(existingValue) : ""

        input.addEventListener("input", (e) => {
          handleCellInput(e, itemKey, day)
        })

        input.addEventListener("focus", (e) => {
          if (e.target.value === "0" || e.target.value === "") {
            e.target.value = ""
          }
        })

        td.appendChild(input)
        row.appendChild(td)
      }

      const categoryTd = document.createElement("td")
      categoryTd.className = "category-cell"

      if (item.fixed) {
        const span = document.createElement("span")
        span.className = "category-cell-static"
        span.textContent = item.name
        categoryTd.appendChild(span)
      } else {
        const input = document.createElement("input")
        input.type = "text"
        input.className = "category-name-input"
        input.value = item.name || ""
        input.placeholder = item.placeholder || ""

        input.addEventListener("input", (e) => {
          userCategories[groupName].items[itemKey].name = e.target.value
          if (cashflowData.settings.autoSave) {
            saveData()
          }
        })

        categoryTd.appendChild(input)
      }

      row.appendChild(categoryTd)
      tableBody.appendChild(row)

      for (let day = 1; day <= daysInMonth; day++) {
        const monthKey = `${currentYear}-${currentMonthIndex + 1}`
        const dayKey = `day-${day}`
        const value = cashflowData.years[monthKey]?.[itemKey]?.[dayKey] || 0

        groupTotalRow[day - 1] += value

        if (item.type === "income" || item.type === "exempt_income") {
          totalIncomeRow[day - 1] += value
        } else {
          totalExpenseRow[day - 1] += value
        }
      }
    })

    const groupSummaryRow = document.createElement("tr")
    groupSummaryRow.className = "group-summary-row"

    for (let day = 1; day <= daysInMonth; day++) {
      const td = document.createElement("td")
      td.textContent = groupTotalRow[day - 1] ? formatNumber(groupTotalRow[day - 1]) : ""
      td.className = "group-total-cell"
      groupSummaryRow.appendChild(td)
    }

    const groupSummaryNameTd = document.createElement("td")
    groupSummaryNameTd.textContent = `סה"כ ${groupName}`
    groupSummaryNameTd.className = "group-summary-name"
    groupSummaryRow.appendChild(groupSummaryNameTd)

    tableBody.appendChild(groupSummaryRow)
  })

  for (let day = 1; day <= daysInMonth; day++) {
    balanceRow[day - 1] = totalIncomeRow[day - 1] - totalExpenseRow[day - 1]
  }

  const footerRows = [
    { label: "סה״כ הכנסות", values: totalIncomeRow, className: "total-income" },
    { label: "סה״כ הוצאות", values: totalExpenseRow, className: "total-expense" },
    { label: "מאזן יומי", values: balanceRow, className: "balance-row" },
  ]

  footerRows.forEach((footerRow) => {
    const tr = document.createElement("tr")
    tr.className = footerRow.className

    for (let day = 1; day <= daysInMonth; day++) {
      const td = document.createElement("td")
      const value = footerRow.values[day - 1]
      td.textContent = value ? formatNumber(value) : ""

      if (footerRow.className === "balance-row") {
        td.className = value >= 0 ? "balance-positive" : "balance-negative"
      } else {
        td.className = footerRow.className
      }

      tr.appendChild(td)
    }

    const labelTd = document.createElement("td")
    labelTd.textContent = footerRow.label
    labelTd.className = "summary-label"
    tr.appendChild(labelTd)

    tableFoot.appendChild(tr)
  })

  const cumulativeRow = document.createElement("tr")
  cumulativeRow.className = "cumulative-balance-row"

  let runningBalance = cashflowData.openingBalance || 0

  for (let day = 1; day <= daysInMonth; day++) {
    runningBalance += balanceRow[day - 1]
    const td = document.createElement("td")
    td.textContent = formatNumber(runningBalance)
    td.className = runningBalance >= 0 ? "balance-positive" : "balance-negative"

    if (runningBalance < 0 && cashflowData.settings.autoAlerts) {
      td.innerHTML += '<span class="gap-alert-icon" title="אזהרה: פער תזרימי!">⚠️</span>'
    }

    cumulativeRow.appendChild(td)
  }

  const cumulativeLabelTd = document.createElement("td")
  cumulativeLabelTd.textContent = "יתרה מצטברת"
  cumulativeLabelTd.className = "summary-label"
  cumulativeRow.appendChild(cumulativeLabelTd)

  tableFoot.appendChild(cumulativeRow)
}

// Render mobile view
function renderMobileView() {
  const mobileContainer = document.getElementById("mobile-view-container")
  mobileContainer.innerHTML = ""

  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const dayCard = document.createElement("div")
    dayCard.className = "bg-white rounded-xl p-4 mb-4 shadow-lg border border-gray-100"

    const dayHeader = document.createElement("h3")
    dayHeader.className =
      "text-lg font-bold mb-4 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
    dayHeader.textContent = `יום ${day} - ${months[currentMonthIndex]}`

    const today = new Date()
    if (currentYear === today.getFullYear() && currentMonthIndex === today.getMonth() && day === today.getDate()) {
      dayHeader.textContent += " (היום)"
      dayHeader.className += " text-yellow-600"
    }

    dayCard.appendChild(dayHeader)

    Object.keys(userCategories).forEach((groupName) => {
      const group = userCategories[groupName]

      if (group.hidden && (!cashflowData.vatSettings || !cashflowData.vatSettings.hasExemptIncome)) {
        return
      }

      const groupDiv = document.createElement("div")
      groupDiv.className = "mb-4"

      const groupTitle = document.createElement("h4")
      groupTitle.className = "font-semibold text-sm mb-2 text-gray-700"
      groupTitle.textContent = groupName
      groupDiv.appendChild(groupTitle)

      Object.keys(group.items).forEach((itemKey) => {
        const item = group.items[itemKey]

        if (item.businessTypes && cashflowData.vatSettings) {
          if (!item.businessTypes.includes(cashflowData.vatSettings.businessType)) {
            return
          }
        }

        const itemDiv = document.createElement("div")
        itemDiv.className = "flex justify-between items-center mb-2"

        const label = document.createElement("span")
        label.className = "text-sm text-gray-600 flex-1"
        label.textContent = item.name || item.placeholder || ""

        const input = document.createElement("input")
        input.type = "text"
        input.inputMode = "decimal"
        input.className = "w-24 px-2 py-1 border border-gray-300 rounded text-center text-sm formatted-number-input"

        const monthKey = `${currentYear}-${currentMonthIndex + 1}`
        const dayKey = `day-${day}`
        const existingValue = cashflowData.years[monthKey]?.[itemKey]?.[dayKey] || 0
        input.value = existingValue ? formatNumber(existingValue) : ""

        input.addEventListener("input", (e) => {
          handleCellInput(e, itemKey, day)
        })

        input.addEventListener("focus", (e) => {
          if (e.target.value === "0" || e.target.value === "") {
            e.target.value = ""
          }
        })

        itemDiv.appendChild(label)
        itemDiv.appendChild(input)
        groupDiv.appendChild(itemDiv)
      })

      dayCard.appendChild(groupDiv)
    })

    mobileContainer.appendChild(dayCard)
  }
}

// Handle cell input
function handleCellInput(event, itemKey, day) {
  const value = parseNumber(event.target.value)
  const monthKey = `${currentYear}-${currentMonthIndex + 1}`
  const dayKey = `day-${day}`

  if (!cashflowData.years[monthKey]) {
    cashflowData.years[monthKey] = {}
  }
  if (!cashflowData.years[monthKey][itemKey]) {
    cashflowData.years[monthKey][itemKey] = {}
  }

  cashflowData.years[monthKey][itemKey][dayKey] = value

  event.target.value = value ? formatNumber(value) : ""

  updateDashboard()

  if (cashflowData.settings.autoSave) {
    clearTimeout(updateTimeout)
    updateTimeout = setTimeout(() => {
      saveData()
    }, 2000)
  }
}

// Update dashboard
function updateDashboard() {
  const monthKey = `${currentYear}-${currentMonthIndex + 1}`
  const monthData = cashflowData.years[monthKey] || {}

  let totalIncome = 0
  let totalExpense = 0
  let totalEmployeeWages = 0
  let totalOwnerWages = 0
  let totalLoans = 0

  Object.keys(userCategories).forEach((groupName) => {
    const group = userCategories[groupName]

    Object.keys(group.items).forEach((itemKey) => {
      const item = group.items[itemKey]

      if (item.businessTypes && cashflowData.vatSettings) {
        if (!item.businessTypes.includes(cashflowData.vatSettings.businessType)) {
          return
        }
      }

      const itemData = monthData[itemKey] || {}
      const itemTotal = Object.values(itemData).reduce((sum, val) => sum + (val || 0), 0)

      if (item.type === "income" || item.type === "exempt_income") {
        totalIncome += itemTotal
      } else if (item.type === "employee_cost") {
        totalEmployeeWages += itemTotal
        totalExpense += itemTotal
      } else if (groupName === "הלוואות") {
        totalLoans += itemTotal
        totalExpense += itemTotal
      } else if (
        itemKey === "owner_withdrawal" ||
        itemKey === "controlling_salary" ||
        itemKey === "dividend_withdrawal"
      ) {
        totalOwnerWages += itemTotal
        totalExpense += itemTotal
      } else {
        totalExpense += itemTotal
      }
    })
  })

  document.getElementById("dashboard-income").textContent = formatNumber(totalIncome) + " ₪"
  document.getElementById("dashboard-expense").textContent = formatNumber(totalExpense) + " ₪"

  const balance = totalIncome - totalExpense
  const balanceElement = document.getElementById("dashboard-balance")
  balanceElement.textContent = formatNumber(balance) + " ₪"
  balanceElement.className =
    balance >= 0 ? "text-2xl lg:text-3xl font-bold text-green-600" : "text-2xl lg:text-3xl font-bold text-red-600"

  document.getElementById("dashboard-employee-wages").textContent = formatNumber(totalEmployeeWages) + " ₪"
  document.getElementById("dashboard-owner-wages").textContent = formatNumber(totalOwnerWages) + " ₪"
  document.getElementById("dashboard-total-wages").textContent =
    formatNumber(totalEmployeeWages + totalOwnerWages) + " ₪"
  document.getElementById("dashboard-total-loans").textContent = formatNumber(totalLoans) + " ₪"

  const paidLoans = totalLoans * 0.3
  const remainingLoans = totalLoans - paidLoans

  document.getElementById("dashboard-paid-loans").textContent = formatNumber(paidLoans) + " ₪"
  document.getElementById("dashboard-remaining-loans").textContent = formatNumber(remainingLoans) + " ₪"

  const ownerCostLabel = document.getElementById("owner-cost-label")
  if (cashflowData.vatSettings) {
    switch (cashflowData.vatSettings.businessType) {
      case "company":
        ownerCostLabel.textContent = "👤 שכר בעלי שליטה + דיבידנד"
        break
      case "authorized":
      case "exempt":
        ownerCostLabel.textContent = "👤 משיכת בעלים"
        break
      default:
        ownerCostLabel.textContent = "👤 שכר בעלים/שליטה"
    }
  }
}

// Save data to Firestore
async function saveData() {
  if (!currentUser) return

  try {
    const docRef = doc(db, "users", currentUser.uid)
    await updateDoc(docRef, {
      clientName: cashflowData.clientName,
      openingBalance: cashflowData.openingBalance,
      years: cashflowData.years,
      settings: cashflowData.settings,
      categories: userCategories,
    })

    showToast("הנתונים נשמרו בהצלחה! ✅")
  } catch (error) {
    console.error("Error saving data:", error)
    showToast("שגיאה בשמירת הנתונים ❌")
  }
}

// Show toast notification
function showToast(message) {
  const toast = document.getElementById("toast")
  toast.textContent = message
  toast.classList.add("show")

  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}

// Number formatting functions
function formatNumber(num) {
  if (!num || num === 0) return ""
  return new Intl.NumberFormat("he-IL").format(num)
}

function parseNumber(str) {
  if (!str) return 0
  return Number.parseFloat(str.replace(/,/g, "")) || 0
}

// Setup year navigation
function setupYearNavigation() {
  prevYearBtn.onclick = () => {
    currentYear--
    renderApp()
  }

  nextYearBtn.onclick = () => {
    currentYear++
    renderApp()
  }
}

// Setup auto save
function setupAutoSave() {
  document.getElementById("clientName").addEventListener("input", (e) => {
    cashflowData.clientName = e.target.value
    if (cashflowData.settings.autoSave) {
      clearTimeout(updateTimeout)
      updateTimeout = setTimeout(saveData, 2000)
    }
  })

  document.getElementById("openingBalance").addEventListener("input", (e) => {
    const value = parseNumber(e.target.value)
    cashflowData.openingBalance = value
    e.target.value = formatNumber(value)
    updateDashboard()

    if (cashflowData.settings.autoSave) {
      clearTimeout(updateTimeout)
      updateTimeout = setTimeout(saveData, 2000)
    }
  })

  document.getElementById("bankLimit").addEventListener("input", (e) => {
    const value = parseNumber(e.target.value)
    e.target.value = formatNumber(value)
  })

  autoSaveCheckbox.addEventListener("change", async (e) => {
    cashflowData.settings.autoSave = e.target.checked
    if (currentUser) {
      try {
        const docRef = doc(db, "users", currentUser.uid)
        await updateDoc(docRef, { settings: cashflowData.settings })
        showToast(e.target.checked ? "שמירה אוטומטית הופעלה ✅" : "שמירה אוטומטית בוטלה ❌")
      } catch (error) {
        console.error("Error updating auto-save setting:", error)
      }
    }
  })

  autoAlertsCheckbox.addEventListener("change", async (e) => {
    cashflowData.settings.autoAlerts = e.target.checked
    if (currentUser) {
      try {
        const docRef = doc(db, "users", currentUser.uid)
        await updateDoc(docRef, { settings: cashflowData.settings })
        showToast(e.target.checked ? "התראות אוטומטיות הופעלו 🚨" : "התראות אוטומטיות בוטלו ❌")
        renderTable()
      } catch (error) {
        console.error("Error updating auto-alerts setting:", error)
      }
    }
  })
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById("saveButton").addEventListener("click", saveData)
  document.getElementById("header-save-btn").addEventListener("click", saveData)

  const todayButtons = ["todayButton", "todayButtonHeader"]
  todayButtons.forEach((buttonId) => {
    document.getElementById(buttonId).addEventListener("click", () => {
      const today = new Date()
      currentYear = today.getFullYear()
      currentMonthIndex = today.getMonth()
      selectedDay = today.getDate() - 1
      renderApp()
    })
  })

  document.getElementById("copyFixedButton").addEventListener("click", async () => {
    const confirmed = await showCustomConfirm("האם להעתיק את ההוצאות הקבועות מהחודש הקודם?")
    if (confirmed) {
      copyFixedExpenses()
    }
  })

  document.getElementById("copyTaxesButton").addEventListener("click", async () => {
    const confirmed = await showCustomConfirm("האם להעתיק את המיסים מהחודש הקודם?")
    if (confirmed) {
      copyTaxes()
    }
  })

  document.getElementById("copyTitlesButton").addEventListener("click", async () => {
    const confirmed = await showCustomConfirm("האם להעתיק את כותרות הקטגוריות מהחודש הקודם?")
    if (confirmed) {
      copyTitles()
    }
  })

  document.getElementById("printButton").addEventListener("click", () => {
    window.print()
  })

  document.getElementById("resetButton").addEventListener("click", async () => {
    const confirmed = await showCustomConfirm(`האם לאפס את כל הנתונים של ${months[currentMonthIndex]} ${currentYear}?`)
    if (confirmed) {
      resetMonth()
    }
  })

  document.getElementById("cashflowGapButton").addEventListener("click", () => {
    checkCashflowGap()
  })

  logoutBtn.addEventListener("click", async () => {
    const confirmed = await showCustomConfirm("האם אתה בטוח שברצונך להתנתק?")
    if (confirmed) {
      try {
        await signOut(auth)
        showToast("התנתקת בהצלחה")
      } catch (error) {
        console.error("Error signing out:", error)
        showToast("שגיאה בהתנתקות")
      }
    }
  })

  settingsBtn.addEventListener("click", () => {
    settingsModal.classList.remove("hidden")
  })

  closeSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.add("hidden")
  })

  changePasswordBtn.addEventListener("click", async () => {
    const newPassword = document.getElementById("new-password").value
    const confirmPassword = document.getElementById("confirm-password").value

    if (!newPassword || !confirmPassword) {
      showCustomAlert("אנא מלא את כל השדות")
      return
    }

    if (newPassword !== confirmPassword) {
      showCustomAlert("הסיסמאות אינן תואמות")
      return
    }

    if (newPassword.length < 6) {
      showCustomAlert("הסיסמה חייבת להכיל לפחות 6 תווים")
      return
    }

    try {
      await updatePassword(currentUser, newPassword)
      showToast("הסיסמה שונתה בהצלחה! 🔐")
      document.getElementById("new-password").value = ""
      document.getElementById("confirm-password").value = ""
    } catch (error) {
      console.error("Error changing password:", error)
      showCustomAlert("שגיאה בשינוי הסיסמה. ייתכן שתצטרך להתחבר מחדש.")
    }
  })

  logoutFromExpiredBtn.addEventListener("click", async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  })
}

// Copy functions
function copyFixedExpenses() {
  const currentMonthKey = `${currentYear}-${currentMonthIndex + 1}`
  let sourceMonthKey

  if (currentMonthIndex === 0) {
    sourceMonthKey = `${currentYear - 1}-12`
  } else {
    sourceMonthKey = `${currentYear}-${currentMonthIndex}`
  }

  const sourceData = cashflowData.years[sourceMonthKey]
  if (!sourceData) {
    showToast("אין נתונים בחודש הקודם להעתקה")
    return
  }

  if (!cashflowData.years[currentMonthKey]) {
    cashflowData.years[currentMonthKey] = {}
  }

  let copiedCount = 0

  const fixedExpensesGroup = userCategories["הוצאות קבועות"]
  if (fixedExpensesGroup) {
    Object.keys(fixedExpensesGroup.items).forEach((itemKey) => {
      if (sourceData[itemKey]) {
        cashflowData.years[currentMonthKey][itemKey] = { ...sourceData[itemKey] }
        copiedCount++
      }
    })
  }

  if (copiedCount > 0) {
    showToast(`הועתקו ${copiedCount} הוצאות קבועות מהחודש הקודם`)
    renderApp()
    if (cashflowData.settings.autoSave) {
      saveData()
    }
  } else {
    showToast("לא נמצאו הוצאות קבועות להעתקה")
  }
}

function copyTaxes() {
  const currentMonthKey = `${currentYear}-${currentMonthIndex + 1}`
  let sourceMonthKey

  if (currentMonthIndex === 0) {
    sourceMonthKey = `${currentYear - 1}-12`
  } else {
    sourceMonthKey = `${currentYear}-${currentMonthIndex}`
  }

  const sourceData = cashflowData.years[sourceMonthKey]
  if (!sourceData) {
    showToast("אין נתונים בחודש הקודם להעתקה")
    return
  }

  if (!cashflowData.years[currentMonthKey]) {
    cashflowData.years[currentMonthKey] = {}
  }

  let copiedCount = 0

  const taxesGroup = userCategories["תשלומים ומיסים"]
  if (taxesGroup) {
    Object.keys(taxesGroup.items).forEach((itemKey) => {
      if (sourceData[itemKey] && itemKey !== "vat_payment" && itemKey !== "vat_field") {
        cashflowData.years[currentMonthKey][itemKey] = { ...sourceData[itemKey] }
        copiedCount++
      }
    })
  }

  if (copiedCount > 0) {
    showToast(`הועתקו ${copiedCount} מיסים מהחודש הקודם`)
    renderApp()
    if (cashflowData.settings.autoSave) {
      saveData()
    }
  } else {
    showToast("לא נמצאו מיסים להעתקה")
  }
}

function copyTitles() {
  const currentMonthKey = `${currentYear}-${currentMonthIndex + 1}`
  let sourceMonthKey

  if (currentMonthIndex === 0) {
    sourceMonthKey = `${currentYear - 1}-12`
  } else {
    sourceMonthKey = `${currentYear}-${currentMonthIndex}`
  }

  const sourceData = cashflowData.years[sourceMonthKey]
  if (!sourceData) {
    showToast("אין נתונים בחודש הקודם להעתקה")
    return
  }

  let copiedCount = 0

  Object.keys(userCategories).forEach((groupName) => {
    const group = userCategories[groupName]
    Object.keys(group.items).forEach((itemKey) => {
      const item = group.items[itemKey]
      if (!item.fixed && sourceData[itemKey]) {
        const sourceItemData = Object.values(sourceData[itemKey])
        if (sourceItemData.some((val) => val > 0)) {
          copiedCount++
        }
      }
    })
  })

  if (copiedCount > 0) {
    showToast(`הועתקו ${copiedCount} כותרות קטגוריות מהחודש הקודם`)
    renderApp()
    if (cashflowData.settings.autoSave) {
      saveData()
    }
  } else {
    showToast("לא נמצאו כותרות להעתקה")
  }
}

function resetMonth() {
  const monthKey = `${currentYear}-${currentMonthIndex + 1}`
  if (cashflowData.years[monthKey]) {
    delete cashflowData.years[monthKey]
    showToast(`החודש ${months[currentMonthIndex]} ${currentYear} אופס בהצלחה`)
    renderApp()
    if (cashflowData.settings.autoSave) {
      saveData()
    }
  } else {
    showToast("החודש כבר ריק")
  }
}

function checkCashflowGap() {
  const monthKey = `${currentYear}-${currentMonthIndex + 1}`
  const monthData = cashflowData.years[monthKey] || {}
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate()

  let runningBalance = cashflowData.openingBalance || 0
  const gapDays = []

  for (let day = 1; day <= daysInMonth; day++) {
    let dayIncome = 0
    let dayExpense = 0

    Object.keys(userCategories).forEach((groupName) => {
      const group = userCategories[groupName]
      Object.keys(group.items).forEach((itemKey) => {
        const item = group.items[itemKey]
        const dayKey = `day-${day}`
        const value = monthData[itemKey]?.[dayKey] || 0

        if (item.type === "income" || item.type === "exempt_income") {
          dayIncome += value
        } else {
          dayExpense += value
        }
      })
    })

    runningBalance += dayIncome - dayExpense

    if (runningBalance < 0) {
      gapDays.push({ day, balance: runningBalance })
    }
  }

  if (gapDays.length > 0) {
    const gapList = gapDays.map((gap) => `יום ${gap.day}: ${formatNumber(gap.balance)} ₪`).join("\n")
    showCustomAlert(`⚠️ זוהו פערים תזרימיים בימים הבאים:\n\n${gapList}\n\nמומלץ לתכנן מקורות מימון נוספים.`)
  } else {
    showCustomAlert("✅ לא זוהו פערים תזרימיים בחודש זה!")
  }
}

// 2FA functions
sendVerificationBtn.addEventListener("click", async () => {
  const phoneNumber = phoneNumberInput.value.trim()

  if (!phoneNumber) {
    showCustomAlert("אנא הזן מספר טלפון")
    return
  }

  if (!phoneNumber.startsWith("+")) {
    showCustomAlert("מספר הטלפון חייב להתחיל ב-+ (לדוגמה: +972501234567)")
    return
  }

  try {
    if (!recaptchaVerifier) {
      recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "normal",
        callback: () => {
          console.log("reCAPTCHA solved")
        },
      })
    }

    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
    showToast("קוד אימות נשלח לטלפון שלך 📱")
    verificationCodeArea.classList.remove("hidden")
    sendVerificationBtn.disabled = true
  } catch (error) {
    console.error("Error sending verification code:", error)
    showCustomAlert("שגיאה בשליחת קוד האימות. אנא נסה שוב.")
    if (recaptchaVerifier) {
      recaptchaVerifier.clear()
      recaptchaVerifier = null
    }
  }
})

verifyPhoneBtn.addEventListener("click", async () => {
  const code = verificationCodeInput.value.trim()

  if (!code || code.length !== 6) {
    showCustomAlert("אנא הזן קוד אימות בן 6 ספרות")
    return
  }

  try {
    const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, code)
    await linkWithCredential(currentUser, credential)

    const docRef = doc(db, "users", currentUser.uid)
    await updateDoc(docRef, {
      phoneNumber: phoneNumberInput.value.trim(),
    })

    showToast("מספר הטלפון אומת בהצלחה! 🎉")
    phoneNumberDisplay.classList.remove("hidden")
    verifiedPhoneSpan.textContent = phoneNumberInput.value.trim()
    remove2faBtn.classList.remove("hidden")
    sendVerificationBtn.textContent = "שנה מספר טלפון"
    verificationCodeArea.classList.add("hidden")
    sendVerificationBtn.disabled = false
    verificationCodeInput.value = ""
  } catch (error) {
    console.error("Error verifying phone number:", error)
    showCustomAlert("קוד האימות שגוי. אנא נסה שוב.")
  }
})

remove2faBtn.addEventListener("click", async () => {
  const confirmed = await showCustomConfirm("האם אתה בטוח שברצונך להסיר את האימות הדו-שלבי?")
  if (confirmed) {
    try {
      const docRef = doc(db, "users", currentUser.uid)
      await updateDoc(docRef, {
        phoneNumber: null,
      })

      showToast("האימות הדו-שלבי הוסר בהצלחה")
      phoneNumberDisplay.classList.add("hidden")
      remove2faBtn.classList.add("hidden")
      sendVerificationBtn.textContent = "שלח קוד אימות"
      phoneNumberInput.value = ""
    } catch (error) {
      console.error("Error removing 2FA:", error)
      showCustomAlert("שגיאה בהסרת האימות הדו-שלבי")
    }
  }
})

// Auth logic
let isLoginMode = true

toggleAuthModeLink.addEventListener("click", (e) => {
  e.preventDefault()
  isLoginMode = !isLoginMode

  if (isLoginMode) {
    authTitle.textContent = "התחברות"
    authSubmitBtn.innerHTML = "🚀 התחבר"
    toggleAuthModeLink.textContent = "אין לך חשבון? הירשם כאן"
    termsContainer.classList.add("hidden")
  } else {
    authTitle.textContent = "הרשמה"
    authSubmitBtn.innerHTML = "🎉 הירשם"
    toggleAuthModeLink.textContent = "יש לך כבר חשבון? התחבר כאן"
    termsContainer.classList.remove("hidden")
  }
})

authForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const email = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value

  if (!email || !password) {
    showAuthMessage("אנא מלא את כל השדות", "error")
    return
  }

  if (!isLoginMode && !termsCheckbox.checked) {
    showAuthMessage("יש לאשר את תנאי השימוש ומדיניות הפרטיות", "error")
    return
  }

  authSubmitBtn.disabled = true
  authSubmitBtn.textContent = isLoginMode ? "מתחבר..." : "נרשם..."

  try {
    if (isLoginMode) {
      await signInWithEmailAndPassword(auth, email, password)
      showAuthMessage("התחברת בהצלחה! 🎉", "success")
    } else {
      await createUserWithEmailAndPassword(auth, email, password)
      showAuthMessage("נרשמת בהצלחה! ברוך הבא! 🎉", "success")
    }
  } catch (error) {
    console.error("Auth error:", error)
    let errorMessage = "שגיאה לא ידועה"

    switch (error.code) {
      case "auth/user-not-found":
        errorMessage = "משתמש לא נמצא"
        break
      case "auth/wrong-password":
        errorMessage = "סיסמה שגויה"
        break
      case "auth/email-already-in-use":
        errorMessage = "כתובת האימייל כבר בשימוש"
        break
      case "auth/weak-password":
        errorMessage = "הסיסמה חלשה מדי (לפחות 6 תווים)"
        break
      case "auth/invalid-email":
        errorMessage = "כתובת אימייל לא תקינה"
        break
      case "auth/too-many-requests":
        errorMessage = "יותר מדי ניסיונות. נסה שוב מאוחר יותר"
        break
      default:
        errorMessage = error.message
    }

    showAuthMessage(errorMessage, "error")
  } finally {
    authSubmitBtn.disabled = false
    authSubmitBtn.textContent = isLoginMode ? "🚀 התחבר" : "🎉 הירשם"
  }
})

forgotPasswordLink.addEventListener("click", async (e) => {
  e.preventDefault()

  const email = document.getElementById("email").value.trim()
  if (!email) {
    showAuthMessage("אנא הזן כתובת אימייל תחילה", "error")
    return
  }

  try {
    await sendPasswordResetEmail(auth, email)
    showAuthMessage("נשלח אימייל לאיפוס סיסמה 📧", "success")
  } catch (error) {
    console.error("Password reset error:", error)
    showAuthMessage("שגיאה בשליחת אימייל לאיפוס סיסמה", "error")
  }
})

function showAuthMessage(message, type) {
  authMessage.textContent = message
  authMessage.className = `px-4 py-3 rounded-xl relative mb-6 ${
    type === "error"
      ? "bg-red-50 border-2 border-red-200 text-red-800"
      : "bg-green-50 border-2 border-green-200 text-green-800"
  }`
  authMessage.classList.remove("hidden")

  setTimeout(() => {
    authMessage.classList.add("hidden")
  }, 5000)
}

// AI Assistant
aiChatButton.addEventListener("click", () => {
  aiChatWidget.classList.toggle("visible")
})

chatCloseBtn.addEventListener("click", () => {
  aiChatWidget.classList.remove("visible")
})

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const message = chatInput.value.trim()
  if (!message) return

  addChatMessage(message, "user")
  chatInput.value = ""
  chatSendBtn.disabled = true

  const typingIndicator = addTypingIndicator()

  try {
    const response = await getAIResponse(message)
    removeTypingIndicator(typingIndicator)
    addChatMessage(response, "assistant")
  } catch (error) {
    console.error("AI Error:", error)
    removeTypingIndicator(typingIndicator)
    addChatMessage("מצטער, אני לא זמין כרגע. נסה שוב מאוחר יותר.", "assistant")
  } finally {
    chatSendBtn.disabled = false
  }
})

function addChatMessage(message, sender) {
  const messageDiv = document.createElement("div")
  messageDiv.className = `chat-message ${sender}`
  messageDiv.innerHTML = message.replace(/\n/g, "<br>")
  chatMessages.appendChild(messageDiv)
  chatMessages.scrollTop = chatMessages.scrollHeight

  chatHistory.push({ message, sender, timestamp: new Date() })
}

function addTypingIndicator() {
  const typingDiv = document.createElement("div")
  typingDiv.className = "chat-message typing-indicator"
  typingDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>'
  chatMessages.appendChild(typingDiv)
  chatMessages.scrollTop = chatMessages.scrollHeight
  return typingDiv
}

function removeTypingIndicator(indicator) {
  if (indicator && indicator.parentNode) {
    indicator.parentNode.removeChild(indicator)
  }
}

async function getAIResponse(message) {
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("שלום") || lowerMessage.includes("היי") || lowerMessage.includes("בוקר טוב")) {
    return "שלום! 👋 אני כאן לעזור לך עם ניהול התזרים. איך אפשר לעזור?"
  }

  if (lowerMessage.includes("מע״מ") || lowerMessage.includes("מעמ")) {
    return `בהתאם להגדרות שלך, אתה ${
      cashflowData.vatSettings?.businessType === "company"
        ? 'חברה בע"מ'
        : cashflowData.vatSettings?.businessType === "authorized"
          ? "עוסק מורשה"
          : "עוסק פטור"
    }. 
    
המערכת מחשבת את המע״מ אוטומטית בהתאם לסוג העסק שלך. האם יש שאלה ספציפית על חישובי המע״מ?`
  }

  if (lowerMessage.includes("שמירה") || lowerMessage.includes("שמור")) {
    return `השמירה האוטומטית שלך כרגע ${cashflowData.settings?.autoSave ? "מופעלת ✅" : "כבויה ❌"}. 
    
אתה יכול לשנות זאת בהגדרות או ללחוץ על כפתור השמירה הידנית. האם תרצה שאסביר איך לשנות את ההגדרות?`
  }

  if (lowerMessage.includes("פער") || lowerMessage.includes("חוב") || lowerMessage.includes("מינוס")) {
    return `זיהיתי שאתה שואל על פערים תזרימיים 📊
    
אתה יכול להשתמש בכפתור "בדיקת פער תזרימי" כדי לקבל ניתוח מפורט של הימים שבהם היתרה שלך עלולה להיות שלילית.

האם תרצה טיפים לניהול פערים תזרימיים?`
  }

  if (lowerMessage.includes("הלוואה") || lowerMessage.includes("הלוואות")) {
    return `ההלוואות שלך מנוהלות בקטגוריה נפרדת 🏦
    
המערכת מחשבת את העלות החודשית הכוללת ומציגה בדשבורד כמה שילמת וכמה נותר לשלם.

האם תרצה עזרה בתכנון תשלומי ההלוואות?`
  }

  if (lowerMessage.includes("דוח") || lowerMessage.includes("הדפס") || lowerMessage.includes("pdf")) {
    return `אתה יכול להדפיס או לשמור כ-PDF את הדוח החודשי 🖨️
    
פשוט לחץ על כפתור "הדפס / PDF" ותוכל לבחור להדפיס או לשמור כקובץ PDF.

הדוח כולל את כל הנתונים החודשיים בפורמט מסודר ומקצועי.`
  }

  if (lowerMessage.includes("קטגוריה") || lowerMessage.includes("קטגוריות")) {
    return `אתה יכול לערוך את הקטגוריות בהגדרות המערכת ✏️
    
לחץ על "הגדרות" ואז "ערוך קטגוריות" כדי להוסיף, למחוק או לשנות קטגוריות.

האם תרצה הסבר על איך להתאים את הקטגוריות לעסק שלך?`
  }

  if (lowerMessage.includes("עזרה") || lowerMessage.includes("איך")) {
    return `אני כאן לעזור! 🤖 הנה כמה דברים שאני יכול לעזור בהם:

• הסבר על חישובי מע״מ
• עזרה עם הגדרות המערכת  
• טיפים לניהול תזרים מזומנים
• הסבר על הדוחות והדשבורד
• עזרה עם קטגוריות ותכנון

פשוט שאל אותי כל שאלה!`
  }

  if (lowerMessage.includes("תודה") || lowerMessage.includes("תודה רבה")) {
    return "בכיף! 😊 אני כאן בכל עת שתצטרך עזרה. בהצלחה עם ניהול התזרים!"
  }

  const defaultResponses = [
    "מעניין! 🤔 אתה יכול לספר לי יותר פרטים כדי שאוכל לעזור לך טוב יותר?",
    "אני כאן לעזור עם ניהול התזרים שלך 💰 איך אפשר לסייע?",
    "יש לי הרבה ידע על ניהול כספים ותזרים מזומנים. מה בדיוק מעניין אותך?",
    "בואו נתמקד בניהול התזרים שלך 📊 איזה נושא תרצה שנדבר עליו?",
  ]

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
}

// Category Editor Functions
editCategoriesBtn.addEventListener("click", () => {
  settingsModal.classList.add("hidden")
  renderCategoryEditor()
  categoryEditorModal.classList.remove("hidden")
})

cancelCategoryEditBtn.addEventListener("click", () => {
  categoryEditorModal.classList.add("hidden")
})

saveCategoryChangesBtn.addEventListener("click", async () => {
  await saveCategoryChanges()
})

function renderCategoryEditor() {
  categoryEditorContainer.innerHTML = ""

  Object.keys(userCategories).forEach((groupName) => {
    const group = userCategories[groupName]

    const groupDiv = document.createElement("div")
    groupDiv.className = "bg-white rounded-xl p-6 border border-gray-200"

    const groupHeader = document.createElement("div")
    groupHeader.className = "flex justify-between items-center mb-4"

    const groupTitle = document.createElement("h4")
    groupTitle.className = "text-lg font-bold text-gray-800"
    groupTitle.textContent = groupName

    const addItemBtn = document.createElement("button")
    addItemBtn.className =
      "add-category-row-btn bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
    addItemBtn.textContent = "➕ הוסף פריט"
    addItemBtn.onclick = () => addCategoryItem(groupName)

    groupHeader.appendChild(groupTitle)
    groupHeader.appendChild(addItemBtn)
    groupDiv.appendChild(groupHeader)

    const itemsContainer = document.createElement("div")
    itemsContainer.className = "space-y-3"
    itemsContainer.id = `items-${groupName.replace(/\s+/g, "-")}`

    Object.keys(group.items).forEach((itemKey) => {
      const item = group.items[itemKey]
      const itemDiv = createCategoryItemEditor(groupName, itemKey, item)
      itemsContainer.appendChild(itemDiv)
    })

    groupDiv.appendChild(itemsContainer)
    categoryEditorContainer.appendChild(groupDiv)
  })
}

function createCategoryItemEditor(groupName, itemKey, item) {
  const itemDiv = document.createElement("div")
  itemDiv.className = "flex items-center gap-3 p-3 bg-gray-50 rounded-lg"

  const nameInput = document.createElement("input")
  nameInput.type = "text"
  nameInput.className = "category-setting-input flex-1"
  nameInput.value = item.name || ""
  nameInput.placeholder = item.placeholder || "שם הקטגוריה"
  nameInput.onchange = () => {
    userCategories[groupName].items[itemKey].name = nameInput.value
  }

  const typeSelect = document.createElement("select")
  typeSelect.className = "category-setting-input w-40"
  const typeOptions = [
    { value: "income", label: "הכנסה" },
    { value: "exempt_income", label: "הכנסה פטורה" },
    { value: "expense", label: "הוצאה" },
    { value: "expense_no_vat", label: "הוצאה ללא מע״מ" },
    { value: "employee_cost", label: "עלות עובד" },
    { value: "partial_vat_expense", label: "הוצאה עם הכרה חלקית" },
    { value: "expense_calculated", label: "הוצאה מחושבת" },
  ]

  typeOptions.forEach((option) => {
    const optionElement = document.createElement("option")
    optionElement.value = option.value
    optionElement.textContent = option.label
    optionElement.selected = item.type === option.value
    typeSelect.appendChild(optionElement)
  })

  typeSelect.onchange = () => {
    userCategories[groupName].items[itemKey].type = typeSelect.value
  }

  const vatRateInput = document.createElement("input")
  vatRateInput.type = "number"
  vatRateInput.className = "category-setting-input w-20"
  vatRateInput.placeholder = "0.67"
  vatRateInput.step = "0.01"
  vatRateInput.min = "0"
  vatRateInput.max = "1"
  vatRateInput.value = item.vatRate || ""
  vatRateInput.style.display = item.type === "partial_vat_expense" ? "block" : "none"
  vatRateInput.onchange = () => {
    userCategories[groupName].items[itemKey].vatRate = Number.parseFloat(vatRateInput.value) || 0.67
  }

  typeSelect.addEventListener("change", () => {
    vatRateInput.style.display = typeSelect.value === "partial_vat_expense" ? "block" : "none"
  })

  const deleteBtn = document.createElement("button")
  deleteBtn.className = "delete-category-btn bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
  deleteBtn.textContent = "🗑️"
  deleteBtn.onclick = () => deleteCategoryItem(groupName, itemKey, itemDiv)

  itemDiv.appendChild(nameInput)
  itemDiv.appendChild(typeSelect)
  itemDiv.appendChild(vatRateInput)
  itemDiv.appendChild(deleteBtn)

  return itemDiv
}

function addCategoryItem(groupName) {
  const newItemKey = `custom_${Date.now()}`
  const newItem = {
    name: "",
    type: "expense",
    placeholder: "פריט חדש",
  }

  userCategories[groupName].items[newItemKey] = newItem

  const itemsContainer = document.getElementById(`items-${groupName.replace(/\s+/g, "-")}`)
  const itemDiv = createCategoryItemEditor(groupName, newItemKey, newItem)
  itemsContainer.appendChild(itemDiv)
}

function deleteCategoryItem(groupName, itemKey, itemDiv) {
  if (userCategories[groupName].items[itemKey].fixed) {
    showCustomAlert("לא ניתן למחוק פריט קבוע")
    return
  }

  delete userCategories[groupName].items[itemKey]
  itemDiv.remove()
}

async function saveCategoryChanges() {
  if (!currentUser) return

  try {
    const docRef = doc(db, "users", currentUser.uid)
    await updateDoc(docRef, {
      categories: userCategories,
    })

    showToast("הקטגוריות נשמרו בהצלחה! ✅")
    categoryEditorModal.classList.add("hidden")
    renderApp()
  } catch (error) {
    console.error("Error saving categories:", error)
    showToast("שגיאה בשמירת הקטגוריות ❌")
  }
}

// Fullscreen functionality
toggleFullscreenBtn.addEventListener("click", () => {
  const isFullscreen = mainTableContainer.classList.contains("fullscreen")

  if (isFullscreen) {
    mainTableContainer.classList.remove("fullscreen")
    document.body.classList.remove("fullscreen-active")
    expandIcon.classList.remove("hidden")
    collapseIcon.classList.add("hidden")
    toggleFullscreenBtn.title = "הצג מסך מלא"
  } else {
    mainTableContainer.classList.add("fullscreen")
    document.body.classList.add("fullscreen-active")
    expandIcon.classList.add("hidden")
    collapseIcon.classList.remove("hidden")
    toggleFullscreenBtn.title = "צא ממסך מלא"
  }
})

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mainTableContainer.classList.contains("fullscreen")) {
    toggleFullscreenBtn.click()
  }
})

window.addEventListener("load", () => {
  // Initial loading handled by onAuthStateChanged
})
