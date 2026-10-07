// ============================================================
// IT HELP & SUPPORT — script.js
// Carousels + dots, privacy modal, lead form submission
// (Google Apps Script / Google Sheets integration unchanged)
// ============================================================

const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbzj70vy6PQ06cdVqf-cAv70GDIlHBcAYYXMjpTBc1B3AoEBELZI780bcAs__Z4lRJ6C/exec";

/* ---------- CAROUSEL ---------- */
function setupCarousel(carouselId, dotsId, intervalMs){
  const track = document.getElementById(carouselId);
  const dotsBox = document.getElementById(dotsId);
  if(!track || !dotsBox) return;

  const items = Array.from(track.children);
  if(items.length === 0) return;

  // build dots
  items.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Go to slide ${i + 1}`);
    if(i === 0) b.classList.add("active");
    b.addEventListener("click", () => scrollToIndex(i, true));
    dotsBox.appendChild(b);
  });
  const dotEls = Array.from(dotsBox.children);

  let index = 0;
  let userInteracted = false;
  let resumeTimer = null;

  function itemOffset(i){
    const item = items[i];
    const style = getComputedStyle(track);
    const gap = parseFloat(style.gap) || 16;
    return item.offsetLeft - (track.clientWidth - item.clientWidth) / 2 < 0
      ? item.offsetLeft
      : item.offsetLeft;
  }

  function scrollToIndex(i, manual){
    index = (i + items.length) % items.length;
    track.scrollTo({ left: items[index].offsetLeft - (track.offsetWidth - items[index].offsetWidth) / 2, behavior: "smooth" });
    dotEls.forEach((d, di) => d.classList.toggle("active", di === index));
    if(manual){
      userInteracted = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { userInteracted = false; }, intervalMs * 3);
    }
  }

  setInterval(() => {
    if(userInteracted) return;
    scrollToIndex(index + 1, false);
  }, intervalMs);

  // keep dots in sync if user swipes manually
  let scrollTimeout;
  track.addEventListener("scroll", () => {
    userInteracted = true;
    clearTimeout(scrollTimeout);
    clearTimeout(resumeTimer);
    scrollTimeout = setTimeout(() => {
      const closest = items.reduce((best, item, i) => {
        const dist = Math.abs(item.offsetLeft - track.scrollLeft);
        return dist < best.dist ? { dist, i } : best;
      }, { dist: Infinity, i: 0 }).i;
      index = closest;
      dotEls.forEach((d, di) => d.classList.toggle("active", di === index));
      resumeTimer = setTimeout(() => { userInteracted = false; }, intervalMs * 3);
    }, 120);
  }, { passive: true });
}

setupCarousel("c2", "c2-dots", 3200);

/* ---------- PRIVACY MODAL ---------- */
const privacyModal = document.getElementById("privacyModal");
document.getElementById("openPrivacy").addEventListener("click", (e) => {
  e.preventDefault();
  privacyModal.classList.add("open");
});
document.getElementById("closePrivacy").addEventListener("click", () => {
  privacyModal.classList.remove("open");
});
privacyModal.addEventListener("click", (e) => {
  if(e.target === privacyModal) privacyModal.classList.remove("open");
});

/* ---------- LEAD FORM SUBMISSION ---------- */
const leadForm = document.getElementById("leadForm");
const submitBtn = document.getElementById("submitBtn");
const formNote = document.getElementById("formNote");

leadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  formNote.textContent = "";

  const data = Object.fromEntries(new FormData(leadForm));

  try{
    await fetch(GAS_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(data)
    });
    submitBtn.textContent = "Submitted!";
    formNote.textContent = "Thank you! We received your request. We will reach you soon.";
    leadForm.reset();
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }, 2500);
  }catch(err){
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
    formNote.textContent = "Something went wrong. Please try again or message us on WhatsApp.";
  }
});
