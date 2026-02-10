document.addEventListener('DOMContentLoaded', function() {
    // Slider Logic
    const container = document.querySelector('.slider-container');
    if (container) {
        const images = container.querySelectorAll('img');
        if (images.length > 0) {
            let currentIndex = 0;
            
            // 复制第一张图片到末尾以实现无缝滚动
            const firstImage = images[0].cloneNode(true);
            container.appendChild(firstImage);
            
            function nextSlide() {
                currentIndex++;
                container.style.transition = 'transform 1s ease';
                container.style.transform = `translateX(-${currentIndex * 100}%)`;
                
                // 当滚动到最后一张（复制的第一张）时
                if (currentIndex === images.length) {
                    // 等待过渡动画完成后
                    setTimeout(() => {
                        // 取消过渡动画
                        container.style.transition = 'none';
                        // 立即回到第一张
                        currentIndex = 0;
                        container.style.transform = `translateX(0)`;
                    }, 500); 
                }
            }
            
            // 每6秒切换一次图片
            setInterval(nextSlide, 6000);
        }
    }

    // Days Toggle Logic
    const days = document.querySelectorAll('.day');
    days.forEach(day => {
        // 创建图标元素
        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.textContent = '►'; // 默认图标

        // 将图标插入到 .day 元素的开头
        day.insertBefore(icon, day.firstChild);
        
        // Note: Click listener is handled by inline onclick in HTML
    });

    // Mobile Navigation Toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Animate hamburger
            const spans = navToggle.querySelectorAll('span');
            if (navMenu.classList.contains('active')) {
                spans[0].style.transform = 'translateY(7px) rotate(45deg)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close menu when clicking a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const spans = navToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }
});

function toggleDetails(dayId) {
    if (!dayId) return;
    const content = document.getElementById(dayId);
    if (!content) return;
    
    // Find trigger (robust fallback for elements without data-target)
    const dayTrigger = document.querySelector(`.day[data-target="${dayId}"]`) || 
                      document.querySelector(`.day[onclick*="'${dayId}'"]`) ||
                      document.querySelector(`.day[onclick*='"${dayId}"']`);
    
    // Check if currently opening or open
    const isOpening = content.classList.contains('show');
    
    if (isOpening) {
        // CLOSE
        // 1. Set height to pixel value to enable transition from it
        content.style.maxHeight = content.scrollHeight + "px";
        content.offsetHeight; // Force reflow
        
        // 2. Remove class
        content.classList.remove('show');
        
        // 3. Set height to 0 (null removes inline style, falling back to CSS -> 0)
        content.style.maxHeight = null; 
        
        if (dayTrigger) {
            const icon = dayTrigger.querySelector('.icon');
            if (icon) icon.classList.remove('rotated');
        }
    } else {
        // OPEN
        content.classList.add('show');
        
        // 1. Get height. 
        // With constant padding in CSS, scrollHeight is always stable and correct.
        // Even if max-height is 0 (closed), scrollHeight returns full content height.
        const targetHeight = content.scrollHeight; 
        
        // 2. Apply animation
        content.style.maxHeight = targetHeight + "px";
        
        if (dayTrigger) {
            const icon = dayTrigger.querySelector('.icon');
            if (icon) icon.classList.add('rotated');
        }
        
        // Cleanup to allow auto-height (responsiveness)
        setTimeout(() => {
            if (content.classList.contains('show')) {
                content.style.maxHeight = "none";
            }
        }, 400); // Matches CSS transition duration
    }
}
