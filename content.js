// Transform Amazon to Netflix-style layout
let isTransformed = false;

function transformLayout() {
  if (isTransformed) return;
  
  // Hide unnecessary elements
  const elementsToHide = [
    '#nav-belt',
    '#navFooter',
    '.s-refinements',
    '.a-pagination',
    '#nav-main',
    '#nav-search',
    '.nav-fill',
    '.s-desktop-toolbar',
    '.s-result-list-placeholder',
    '.s-breadcrumb',
    '.puis-sponsored-label-text',
    '.AdHolder',
    '[data-component-type="sp-sponsored-result"]',
    '.s-desktop-content .celwidget',
    '.s-sorting-options',
    '#a-page'
  ];
  
  elementsToHide.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) element.style.display = 'none';
  });

  const products = document.querySelectorAll('[data-component-type="s-search-result"]');
  if (products.length === 0) return;

  // Create hero section with first product
  const firstProduct = products[0];
  const heroImg = firstProduct.querySelector('img');
  const heroTitle = firstProduct.querySelector('h2');
  
  if (heroImg && heroTitle) {
    const heroSection = document.createElement('div');
    heroSection.className = 'netflix-hero';
    heroSection.style.backgroundImage = `url(${heroImg.src})`;
    
    heroSection.innerHTML = `
      <div class="hero-content">
        <h1 class="hero-title">${heroTitle.textContent}</h1>
        <p class="hero-description">Featured Product</p>
      </div>
    `;
    
    document.body.insertBefore(heroSection, document.body.firstChild);
  }

  // Create carousel for remaining products
  const carouselSection = document.createElement('div');
  carouselSection.className = 'netflix-carousel';
  
  const carouselItems = Array.from(products).slice(1, 11).map(product => {
    const img = product.querySelector('img');
    const title = product.querySelector('h2');
    
    return `
      <div class="carousel-item">
        <img src="${img?.src || ''}" alt="">
        <h3>${title?.textContent || ''}</h3>
      </div>
    `;
  }).join('');

  carouselSection.innerHTML = `
    <h2 class="carousel-title">More Products</h2>
    <div class="carousel-container">
      <button class="carousel-nav carousel-prev">‹</button>
      <div class="carousel-track">${carouselItems}</div>
      <button class="carousel-nav carousel-next">›</button>
    </div>
  `;

  document.body.appendChild(carouselSection);

  // Carousel navigation
  let currentIndex = 0;
  const track = carouselSection.querySelector('.carousel-track');
  const prevBtn = carouselSection.querySelector('.carousel-prev');
  const nextBtn = carouselSection.querySelector('.carousel-next');
  
  prevBtn.onclick = () => {
    currentIndex = Math.max(0, currentIndex - 1);
    track.style.transform = `translateX(-${currentIndex * 216}px)`;
  };
  
  nextBtn.onclick = () => {
    const maxIndex = Math.max(0, track.children.length - 5);
    currentIndex = Math.min(maxIndex, currentIndex + 1);
    track.style.transform = `translateX(-${currentIndex * 216}px)`;
  };

  // Hide original results
  const resultsList = document.querySelector('.s-result-list');
  if (resultsList) resultsList.style.display = 'none';
  
  isTransformed = true;
}

// Run transformation when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', transformLayout);
} else {
  setTimeout(transformLayout, 1000);
}
