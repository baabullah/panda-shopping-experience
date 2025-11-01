// Amazon Netflix Style Extension v2.0
class AmazonNetflixTransformer {
  constructor() {
    this.isTransformed = false;
    this.currentIndex = 0;
    this.products = [];
    this.carouselTrack = null;
    this.itemsPerView = 6;
    this.maxIndex = 0;
  }

  truncateTitle(title, maxLength = 80) {
    if (!title || title.length <= maxLength) return title;
    return title.substring(0, maxLength).trim() + '...';
  }

  getHighResImage(thumbnailUrl) {
    if (!thumbnailUrl) return '';
    return thumbnailUrl
      .replace(/_AC_[A-Z]{2}\d+_/, '_AC_SL1500_')
      .replace(/_SX\d+_/, '_SX800_')
      .replace(/_SY\d+_/, '_SY800_');
  }

  extractProductInfo(product) {
    const img = product.querySelector('img');
    const price = product.querySelector('.a-price-whole, .a-offscreen');
    const rating = product.querySelector('.a-icon-alt');
    
    // Check if this is a sponsored product
    const isSponsored = product.textContent.includes('Sponsored') || 
                       product.querySelector('[data-component-type="sp-sponsored-result"]') ||
                       product.querySelector('.s-label-popover-default');
    
    // Get product link - enhanced approach for sponsored products
    const titleLink = product.querySelector('h2 a');
    let link = titleLink?.href || '#';
    
    // If link is still search page or invalid, try to find actual product link
    if (link.includes('/s?k=') || link === '#') {
      // Try multiple selectors for product links
      const linkSelectors = [
        'a[href*="/dp/"]',
        'a[href*="/gp/product/"]',
        'a[href*="/sspa/click"]', // Sponsored product click tracking
        'a[href*="/gp/slredirect/"]',
        '.a-link-normal[href*="/dp/"]',
        '[data-asin] a[href*="/dp/"]'
      ];
      
      for (const selector of linkSelectors) {
        const foundLink = product.querySelector(selector);
        if (foundLink && foundLink.href) {
          link = foundLink.href;
          break;
        }
      }
    }
    
    // Handle sponsored product links (/sspa/click)
    if (link.includes('/sspa/click')) {
      try {
        const url = new URL(link);
        const urlParam = url.searchParams.get('url');
        if (urlParam) {
          // Decode the URL parameter
          const decodedUrl = decodeURIComponent(urlParam);
          // Extract the /dp/ part
          const dpMatch = decodedUrl.match(/\/dp\/[A-Z0-9]+/);
          if (dpMatch) {
            link = window.location.origin + dpMatch[0] + '?tag=baabullah0c-20';
          }
        }
      } catch (e) {
        console.log('Error parsing sponsored link:', e);
      }
    }
    // Clean the link and add affiliate tag
    else if (link.includes('/dp/') || link.includes('/gp/product/')) {
      const url = new URL(link);
      link = url.origin + url.pathname + '?tag=baabullah0c-20';
    }
    
    console.log('Product extraction:', {
      isSponsored,
      title: product.querySelector('h2')?.textContent?.substring(0, 50),
      originalLink: titleLink?.href,
      finalLink: link
    });
    
    // Try multiple selectors for title to get the most detailed one
    const titleSelectors = [
      'h2 a span[aria-label]',
      'h2 a span',
      'h2 span',
      '.a-size-base-plus',
      '.a-size-medium',
      '.a-text-normal',
      '[data-cy="title-recipe-label"] + span',
      'h2 a'
    ];
    
    let title = 'Product';
    for (const selector of titleSelectors) {
      const titleEl = product.querySelector(selector);
      if (titleEl) {
        const titleText = titleEl.getAttribute('aria-label') || titleEl.textContent?.trim();
        if (titleText && titleText.length > title.length && !titleText.includes("Amazon's Choice")) {
          title = titleText;
        }
      }
    }
    
    // Check for badges
    const isAmazonsChoice = product.querySelector('[data-cy="title-recipe-label"]') || 
                           product.querySelector('.s-label-popover-default') ||
                           product.textContent.includes("Amazon's Choice");
    const isBestSeller = product.querySelector('.a-badge-label') && 
                        product.textContent.includes('Best Seller');

    // Clean up title - remove sponsored text
    if (title.includes("Sponsored Ad -")) {
      title = title.replace(/Sponsored Ad -\s*/, '');
    }
    if (title.includes("Amazon's Choice:")) {
      title = title.replace(/Amazon's Choice:\s*/, '');
    }

    return {
      image: img?.src || '',
      title: title,
      price: price?.textContent?.trim() || '',
      rating: rating?.textContent?.match(/[\d.]+/)?.[0] || '',
      link: link,
      isAmazonsChoice,
      isBestSeller,
      isSponsored
    };
  }

  hideClutterElements() {
    const selectors = [
      '#nav-belt', '#navFooter', '.s-refinements', '.a-pagination',
      '#nav-main', '#nav-search', '.nav-fill', '.s-desktop-toolbar',
      '.s-result-list-placeholder', '.s-breadcrumb', '.puis-sponsored-label-text',
      '.AdHolder', '[data-component-type="sp-sponsored-result"]',
      '.s-desktop-content .celwidget', '.s-sorting-options', '#a-page',
      '.s-desktop-content', '.s-main-slot', '.s-result-list'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = 'none';
      });
    });
  }

  updateHeroSection(product) {
    const heroSection = document.querySelector('.netflix-hero');
    if (!heroSection || !product) return;

    const heroImg = this.getHighResImage(product.image);
    const imgElement = heroSection.querySelector('.hero-image');
    if (imgElement) {
      imgElement.src = heroImg;
      imgElement.alt = product.title;
    }
    
    const titleEl = heroSection.querySelector('.hero-title');
    titleEl.innerHTML = `
      ${this.truncateTitle(product.title)}
      ${product.isAmazonsChoice ? '<span class="hero-badge choice">⭐ Amazon\'s Choice</span>' : ''}
      ${product.isBestSeller ? '<span class="hero-badge bestseller">🏆 Best Seller</span>' : ''}
    `;
    
    const ratingEl = heroSection.querySelector('#hero-rating');
    const priceEl = heroSection.querySelector('#hero-price');
    
    if (ratingEl) ratingEl.textContent = product.rating ? `★ ${product.rating}` : '';
    if (priceEl) priceEl.textContent = product.price || '';
    
    const heroBtn = heroSection.querySelector('.hero-btn.primary');
    if (heroBtn) {
      // Remove any existing event listeners
      heroBtn.onclick = null;
      
      // Create new handler function
      const clickHandler = () => {
        console.log('Button clicked, product link:', product.link);
        if (product.link && product.link !== '#') {
          window.open(product.link, '_blank');
        } else {
          console.log('Invalid link:', product.link);
        }
      };
      
      // Assign new handler
      heroBtn.onclick = clickHandler;
      console.log('Updated hero button for product:', product.title, 'Link:', product.link);
    } else {
      console.log('Hero button not found');
    }
    
    // Scroll to hero
    heroSection.scrollIntoView({ behavior: 'smooth' });
  }

  setupSearchBox(heroSection) {
    const searchInput = heroSection.querySelector('.search-input');
    
    searchInput.onkeypress = (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          const currentDomain = window.location.hostname;
          window.location.href = `https://${currentDomain}/s?k=${encodeURIComponent(query)}`;
        }
      }
    };
  }

  setupHeroImagePanning(heroSection) {
    // Mouse panning removed - image now shows fully
  }

  createHeroSection(heroProduct) {
    const heroSection = document.createElement('div');
    heroSection.className = 'netflix-hero';
    
    // Set wallpaper background with external URL
    heroSection.style.background = `url("https://i.ibb.co.com/4g583fLY/wallpaper.jpg") center/cover, linear-gradient(135deg, #141414 0%, #1a1a1a 100%)`;
    
    const heroImg = this.getHighResImage(heroProduct.image);
    
    heroSection.innerHTML = `
      <div class="hero-gradient"></div>
      <div class="netflix-search">
        <input type="text" class="search-input" placeholder="Search products..." />
      </div>
      <div class="hero-content">
        <h1 class="hero-title">
          ${this.truncateTitle(heroProduct.title)}
          ${heroProduct.isAmazonsChoice ? '<span class="hero-badge choice">⭐ Amazon\'s Choice</span>' : ''}
          ${heroProduct.isBestSeller ? '<span class="hero-badge bestseller">🏆 Best Seller</span>' : ''}
        </h1>
        <div class="hero-meta">
          ${heroProduct.rating ? `<span class="hero-rating" id="hero-rating">★ ${heroProduct.rating}</span>` : '<span class="hero-rating" id="hero-rating"></span>'}
          ${heroProduct.price ? `<span class="hero-price" id="hero-price">${heroProduct.price}</span>` : '<span class="hero-price" id="hero-price"></span>'}
        </div>
        <p class="hero-description">Featured Product</p>
        <div class="hero-buttons">
          <button class="hero-btn primary">
            ▶ View Product
          </button>
          <button class="hero-btn secondary" onclick="this.closest('.netflix-hero').scrollIntoView({behavior: 'smooth', block: 'end'})">
            ⓘ More Info
          </button>
        </div>
      </div>
      <div class="hero-image-container">
        <img src="${heroImg}" alt="${heroProduct.title}" class="hero-image">
      </div>
    `;
    
    document.body.insertBefore(heroSection, document.body.firstChild);
    
    // Setup initial hero button onclick
    const initialHeroBtn = heroSection.querySelector('.hero-btn.primary');
    if (initialHeroBtn) {
      initialHeroBtn.onclick = () => {
        if (heroProduct.link && heroProduct.link !== '#') {
          window.open(heroProduct.link, '_blank');
        }
      };
    }
    
    // Setup image panning
    this.setupHeroImagePanning(heroSection);
    
    // Setup search functionality
    this.setupSearchBox(heroSection);
    
    // Add loading animation
    setTimeout(() => heroSection.classList.add('loaded'), 100);
  }

  createCarousel(products, title = 'More Products') {
    const carouselSection = document.createElement('div');
    carouselSection.className = 'netflix-carousel';
    
    const carouselItems = products.map((product, index) => `
      <div class="carousel-item" data-index="${index}">
        <div class="item-image">
          <img src="${product.image}" alt="${product.title}" loading="lazy">
          <div class="item-overlay">
            <div class="item-info">
              <h4>${product.title}</h4>
              ${product.rating ? `<div class="item-rating">★ ${product.rating}</div>` : ''}
              ${product.price ? `<div class="item-price">${product.price}</div>` : ''}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    this.maxIndex = Math.max(0, products.length - this.itemsPerView);

    carouselSection.innerHTML = `
      <h2 class="carousel-title">${title}</h2>
      <div class="carousel-container">
        <button class="carousel-nav carousel-prev" ${this.currentIndex === 0 ? 'disabled' : ''}>‹</button>
        <div class="carousel-viewport">
          <div class="carousel-track">${carouselItems}</div>
        </div>
        <button class="carousel-nav carousel-next" ${this.currentIndex >= this.maxIndex ? 'disabled' : ''}>›</button>
      </div>
    `;

    document.body.appendChild(carouselSection);
    this.carouselTrack = carouselSection.querySelector('.carousel-track');
    
    // Store products reference for click events
    carouselSection.productsArray = products;
    
    this.setupCarouselEvents(carouselSection);
    this.setupKeyboardNavigation();
    
    return carouselSection;
  }

  setupCarouselEvents(carousel) {
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    
    prevBtn.onclick = () => this.moveCarousel(-1);
    nextBtn.onclick = () => this.moveCarousel(1);
    
    // Item click events
    carousel.querySelectorAll('.carousel-item').forEach(item => {
      item.onclick = () => {
        const index = parseInt(item.dataset.index);
        const selectedProduct = carousel.productsArray[index];
        this.updateHeroSection(selectedProduct);
      };
      
      // Hover effects
      item.onmouseenter = () => {
        item.style.transform = 'scale(1.05) translateY(-10px)';
      };
      
      item.onmouseleave = () => {
        item.style.transform = 'scale(1) translateY(0)';
      };
    });
  }

  moveCarousel(direction) {
    this.currentIndex = Math.max(0, Math.min(this.maxIndex, this.currentIndex + direction));
    
    if (this.carouselTrack) {
      const itemWidth = 220; // 200px + 20px gap
      this.carouselTrack.style.transform = `translateX(-${this.currentIndex * itemWidth}px)`;
    }
    
    // Update button states
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    
    if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
    if (nextBtn) nextBtn.disabled = this.currentIndex >= this.maxIndex;
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.moveCarousel(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.moveCarousel(1);
          break;
        case 'Home':
          e.preventDefault();
          this.currentIndex = 0;
          this.moveCarousel(0);
          break;
        case 'End':
          e.preventDefault();
          this.currentIndex = this.maxIndex;
          this.moveCarousel(0);
          break;
      }
    });
  }

  addLoadingIndicator() {
    const loader = document.createElement('div');
    loader.className = 'netflix-loader';
    loader.innerHTML = `
      <div class="loader-content">
        <div class="loader-spinner"></div>
        <p>Transforming to Netflix style...</p>
      </div>
    `;
    document.body.appendChild(loader);
    
    setTimeout(() => {
      loader.classList.add('fade-out');
      setTimeout(() => loader.remove(), 500);
    }, 1000);
  }

  showConsentPopup() {
    return new Promise((resolve) => {
      const popup = document.createElement('div');
      popup.className = 'netflix-consent-popup';
      popup.innerHTML = `
        <div class="consent-overlay"></div>
        <div class="consent-modal">
          <div class="consent-header">
            <h2>🐼 Panda Shopping Experience</h2>
          </div>
          <div class="consent-content">
            <p>Welcome! This extension transforms Amazon into a beautiful cinematic interface to enhance your shopping experience.</p>
            <p><strong>Transparency Notice:</strong> When you purchase products through links in this extension, we may earn a small commission from Amazon at no additional cost to you. Your prices remain exactly the same.</p>
            <p>This helps us maintain and improve the extension. Do you agree to continue?</p>
          </div>
          <div class="consent-buttons">
            <button class="consent-btn decline">No, Thanks</button>
            <button class="consent-btn accept">Yes, I Agree</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(popup);
      
      popup.querySelector('.accept').onclick = () => {
        localStorage.setItem('netflix-extension-consent', 'true');
        popup.remove();
        resolve(true);
      };
      
      popup.querySelector('.decline').onclick = () => {
        popup.remove();
        resolve(false);
      };
    });
  }

  async checkConsent() {
    const consent = localStorage.getItem('netflix-extension-consent');
    if (consent === 'true') {
      return true;
    }
    return await this.showConsentPopup();
  }

  async transform() {
    if (this.isTransformed || document.querySelector('.netflix-hero')) return;
    
    // Check consent first
    const hasConsent = await this.checkConsent();
    if (!hasConsent) {
      return; // Exit if user doesn't consent
    }
    
    // Only transform on Amazon search pages
    if (!window.location.pathname.includes('/s') || !window.location.search.includes('k=')) {
      return;
    }
    
    // Check if we're on a search results page
    const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');
    if (productElements.length === 0) return;

    this.addLoadingIndicator();
    this.hideClutterElements();
    
    // Extract product information
    this.products = Array.from(productElements)
      .map(el => this.extractProductInfo(el))
      .filter(product => product.image && product.title);
    
    if (this.products.length === 0) return;
    
    // Find first product with valid link for hero
    const heroProduct = this.products.find(p => p.link !== '#') || this.products[0];
    const remainingProducts = this.products.filter(p => p !== heroProduct);
    
    console.log('Hero product:', heroProduct.title, 'Link:', heroProduct.link);
    console.log('Remaining products:', remainingProducts.map(p => ({ title: p.title, link: p.link })));
    
    // Create hero section with product that has valid link
    this.createHeroSection(heroProduct);
    
    // Create carousel with remaining products
    if (remainingProducts.length > 0) {
      this.createCarousel(remainingProducts, 'More Products');
    }
    
    // Set body background only after transformation
    document.body.style.background = '#141414';
    document.body.style.margin = '0';
    document.body.style.fontFamily = 'Netflix Sans, Helvetica, Arial, sans-serif';
    
    this.isTransformed = true;
  }
}

// Initialize transformer
const transformer = new AmazonNetflixTransformer();

// Execute transformation
function initTransform() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => transformer.transform(), 500);
    });
  } else {
    setTimeout(() => transformer.transform(), 500);
  }
}

// Handle dynamic content loading
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    transformer.isTransformed = false;
    setTimeout(() => transformer.transform(), 1000);
  }
}).observe(document, { subtree: true, childList: true });

initTransform();
