document.addEventListener('DOMContentLoaded', function () {
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

    // Anniversary photo carousel
    const marquee = document.querySelector('.photo-marquee');
    const marqueeTrack = document.querySelector('.photo-marquee-track');
    const marqueePrev = document.querySelector('.photo-nav-prev');
    const marqueeNext = document.querySelector('.photo-nav-next');
    const lightbox = document.getElementById('photoLightbox');
    const lightboxImage = lightbox ? lightbox.querySelector('img') : null;
    const lightboxCaption = lightbox ? lightbox.querySelector('figcaption') : null;
    const lightboxClose = lightbox ? lightbox.querySelector('.photo-lightbox-close') : null;
    let pausePhotoCarousel = () => { };
    let resumePhotoCarousel = () => { };

    if (marquee && marqueeTrack) {
        const originalSlides = Array.from(marqueeTrack.querySelectorAll('figure:not([aria-hidden="true"])'));
        const leadingClones = document.createDocumentFragment();
        originalSlides.forEach((figure) => {
            const clone = figure.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            const cloneImage = clone.querySelector('img');
            if (cloneImage) cloneImage.alt = '';
            leadingClones.appendChild(clone);
        });
        marqueeTrack.insertBefore(leadingClones, marqueeTrack.firstChild);

        let photoIndex = originalSlides.length;
        let photoTimer = null;
        const transitionMs = 850;
        const pauseMs = 2600;

        originalSlides.forEach((figure) => {
            figure.tabIndex = 0;
            figure.setAttribute('role', 'button');
            figure.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openPhotoLightbox(figure);
                }
            });
        });

        function slideCenterOffset(index) {
            const slides = Array.from(marqueeTrack.querySelectorAll('figure'));
            const slide = slides[index];
            if (!slide) return 0;
            const gap = parseFloat(getComputedStyle(marqueeTrack).gap) || 0;
            const slideLeft = slides.slice(0, index).reduce((offset, previousSlide) => {
                return offset + previousSlide.getBoundingClientRect().width + gap;
            }, 0);
            const marqueeWidth = marquee.getBoundingClientRect().width;
            const slideWidth = slide.getBoundingClientRect().width;
            return slideLeft - ((marqueeWidth - slideWidth) / 2);
        }

        function goToPhoto(index, animate = true) {
            marqueeTrack.style.transition = animate ? `transform ${transitionMs}ms ease` : 'none';
            marqueeTrack.style.transform = `translateX(${-slideCenterOffset(index)}px)`;
        }

        function movePhoto(direction) {
            photoIndex += direction;
            goToPhoto(photoIndex);

            if (photoIndex >= originalSlides.length * 2) {
                setTimeout(() => {
                    photoIndex -= originalSlides.length;
                    goToPhoto(photoIndex, false);
                }, transitionMs);
            }

            if (photoIndex < originalSlides.length) {
                setTimeout(() => {
                    photoIndex += originalSlides.length;
                    goToPhoto(photoIndex, false);
                }, transitionMs);
            }
        }

        pausePhotoCarousel = function () {
            clearTimeout(photoTimer);
        };

        function scheduleNextPhoto() {
            clearTimeout(photoTimer);
            photoTimer = setTimeout(() => {
                movePhoto(1);
                scheduleNextPhoto();
            }, pauseMs);
        }

        resumePhotoCarousel = scheduleNextPhoto;

        function movePhotoManually(direction) {
            pausePhotoCarousel();
            movePhoto(direction);
            scheduleNextPhoto();
        }

        marqueeTrack.addEventListener('click', (event) => {
            const figure = event.target.closest('figure');
            if (figure) openPhotoLightbox(figure);
        });

        if (marqueePrev) {
            marqueePrev.addEventListener('click', () => movePhotoManually(-1));
        }

        if (marqueeNext) {
            marqueeNext.addEventListener('click', () => movePhotoManually(1));
        }

        function centerCurrentPhoto() {
            goToPhoto(photoIndex, false);
        }

        const carouselImages = Array.from(marqueeTrack.querySelectorAll('img'));
        Promise.all(carouselImages.map((image) => {
            if (image.complete) return Promise.resolve();
            return new Promise((resolve) => {
                image.addEventListener('load', resolve, { once: true });
                image.addEventListener('error', resolve, { once: true });
            });
        })).then(centerCurrentPhoto);

        window.addEventListener('resize', centerCurrentPhoto);
        centerCurrentPhoto();
        scheduleNextPhoto();
    }

    function openPhotoLightbox(figure) {
        if (!lightbox || !lightboxImage || !lightboxCaption) return;
        const image = figure.querySelector('img');
        const caption = figure.querySelector('figcaption');
        if (!image) return;

        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt || caption?.textContent.trim() || 'ITCS workshop group photo';
        lightboxCaption.textContent = caption?.textContent.trim() || '';
        lightbox.classList.add('show');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightbox-open');
        pausePhotoCarousel();
        if (lightboxClose) lightboxClose.focus();
    }

    function closePhotoLightbox() {
        if (!lightbox || !lightboxImage) return;
        lightbox.classList.remove('show');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lightbox-open');
        lightboxImage.src = '';
        resumePhotoCarousel();
    }

    if (lightbox) {
        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox || event.target === lightboxClose) {
                closePhotoLightbox();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && lightbox.classList.contains('show')) {
                closePhotoLightbox();
            }
        });
    }

    // Speaker cards collapse by default; click a card to reveal details.
    const speakerCards = document.querySelectorAll('.speaker-card');
    speakerCards.forEach((card) => {
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-expanded', 'false');
        card.addEventListener('click', () => toggleSpeakerCard(card));
        card.querySelectorAll('.speaker-homepage-link').forEach((link) => {
            link.addEventListener('click', (event) => event.stopPropagation());
        });
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleSpeakerCard(card);
            }
        });
    });

    function toggleSpeakerCard(card) {
        const isExpanded = card.classList.toggle('expanded');
        card.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
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
        navToggle.addEventListener('click', function () {
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

        // Close menu when clicking a link (but not dropdown toggle)
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.classList.contains('dropdown-toggle')) {
                    e.preventDefault();
                    const dropdownMenu = link.nextElementSibling;
                    if (dropdownMenu) {
                        dropdownMenu.classList.toggle('show');
                    }
                    return;
                }

                navMenu.classList.remove('active');
                const spans = navToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });

        // Close dropdown when clicking outside (optional, but good for UX)
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-item-dropdown')) {
                const dropdowns = document.querySelectorAll('.dropdown-menu.show');
                dropdowns.forEach(d => d.classList.remove('show'));
            }
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

const translations = {
    'en': {
        'nav_home': 'Home',
        'breadcrumb_home': 'Home',
        'breadcrumb_workshop': '10th Anniversary Workshop',
        'nav_programs_events': 'Programs & Events',
        'nav_workshop': '10th Anniversary Workshop',
        'nav_about': 'About ITCS',
        'nav_research': 'Research',
        'nav_contact': 'Contact & Directions',
        'nav_background': 'Background',
        'nav_schedule': 'Schedule',
        'nav_speakers': 'Speaker',
        'nav_register': 'Register',
        'nav_poster': 'Poster',
        'nav_org': 'Organization',
        'home_itcs_intro_title': 'About ITCS',
        'home_itcs_intro_content': 'The Institute for Theoretical Computer Science (ITCS) is an academic unit at Shanghai University of Finance and Economics (SUFE), established to foster world-class research in theoretical computer science. SUFE is a leading research university with strengths in economics, finance, and business. In recent years, the university has continued to expand its investment in foundational disciplines connected to finance and economics, with computer science and ITCS among its strategic priorities. Founded in 2016, ITCS is now celebrating its 10th anniversary.',
        'home_anniversary_intro_title': '10th Anniversary Celebration',
        'home_anniversary_intro_content': 'The Institute for Theoretical Computer Science (ITCS) at Shanghai University of Finance and Economics was officially established on June 18, 2016. In 2026, ITCS marks its 10th anniversary. This workshop brings together researchers and students to reflect on the institute\'s development, celebrate its achievements, and discuss future directions in theoretical computer science.',

        'section_research': 'Research',
        'research_content_1': 'Research at ITCS spans core problems in theoretical computer science as well as interdisciplinary topics studied through a theoretical computer science perspective. Our work on algorithms and complexity includes the classification of computational tasks through dichotomy theorems, together with the design and analysis of approximation algorithms.',
        'research_content_2': 'In the social sciences and economics, our work covers mechanism design and computational game theory. In the natural sciences, our research in computational physics studies the theoretical analysis of phase transitions in complex networks. ITCS research also contributes to machine learning, information theory, and operations research, with connections to practical problems in engineering and information technology.',

        'section_contact_directions': 'Contact & Directions',
        'address_title': 'Address',
        'address_details': 'Institute for Theoretical Computer Science<br>School of Information Management and Engineering<br>Shanghai University of Finance and Economics<br>No. 100 Wudong Road, Yangpu District, Shanghai 200433, China<br>Telephone: 86-21-65901160<br>Email: itcs(AT)mail.shufe.edu.cn',

        'directions_title': 'Directions to Wudong Campus, SUFE',
        'directions_pudong_title': 'Directions from Pudong Airport:',
        'directions_pudong_content': 'Please take Airport Express Line 4, transfer to Bus 99/749/713 at Wu Jiao Chang Station, and then get off at Wuchuan Road, Wudong Road Station. Then walk to Wudong Road Campus.',
        'directions_hongqiao_title': 'Directions from Hongqiao Airport/Hongqiao Railway Station:',
        'directions_hongqiao_content': 'Please take Metro Line 10, transfer to Bus 819 at Jiangwan Stadium Station, and then get off at Wuchuan Road, Zhengli Road Station. Then walk to Wudong Road Campus.',
        'directions_railway_title': 'Directions from Shanghai Railway Station:',
        'directions_railway_content': 'Please take Metro Line 3, and get off at Jiangwan Town Station, then you can take a taxi to Wudong Road Campus.',

        'section_contact': 'Contact Us',
        'contact_email': 'Contact Email: liang.huili@mail.shufe.edu.cn',
        'section_background': 'Background',
        'background_content': 'The Institute for Theoretical Computer Science (ITCS) at Shanghai University of Finance and Economics was officially established on June 18, 2016. To mark its 10th anniversary, ITCS is organizing a workshop in theoretical computer science, bringing together colleagues, collaborators, and students to exchange ideas and celebrate a decade of research and community building.',
        'event_date': '📅 Date: June 19-21, 2026',
        'event_location': '📍 Venue: First Floor, Research Laboratory Building, Wudong Road Campus, Shanghai University of Finance and Economics, Yangpu District, Shanghai',
        'schedule_title': 'Schedule (June 19-21, 2026)',
        'day1_label': 'June 19 (Friday)',
        'table_time': 'Time',
        'table_speaker': 'Speaker',
        'table_topic': 'Topic',
        'table_host': 'Host',
        'schedule_tbd': 'TBD',
        'speaker_zhang_yuhao': 'Yuhao Zhang',
        'host_fu_hu': 'Hu Fu',
        'speaker_he_lie': 'Lie He',
        'tea_break': 'Tea Break',
        'speaker_wu_xuan': 'Xuan Wu',
        'host_wang_xiao': 'Xiao Wang',
        'speaker_jiang_shaofeng': 'Shaofeng Jiang',
        'lunch': 'Lunch',
        'staff_canteen': 'Staff Canteen',
        'day2_label': 'June 20 (Saturday)',
        'speaker_duan_ran': 'Ran Duan',
        'host_tang_zhihao': 'Zhihao Tang',
        'speaker_chen_yijia': 'Yijia Chen',
        'speaker_zhao_han': 'Han Zhao',
        'tea_break_photo': 'Tea Break & Group Photo',
        'speaker_liang_xiao': 'Xiao Liang',
        'host_tao_yixin': 'Yixin Tao',
        'speaker_li_yuan': 'Yuan Li',
        'speaker_chen_xue': 'Xue Chen',
        'dinner': 'Dinner',
        'day3_label': 'June 21 (Sunday)',
        'speaker_han_kai': 'Kai Han',
        'host_guo_zichao': 'Zichao Guo',
        'speaker_feng_yiding': 'Yiding Feng',
        'speaker_li_shuai': 'Shuai Li',
        'host_xu_renzhe': 'Renzhe Xu',
        'speaker_jin_yaonan': 'Yaonan Jin',
        'section_speakers': 'Speaker',
        'label_title': 'Title',
        'label_abstract': 'Abstract',
        'label_bio': 'Bio',
        'research_building_caption': 'Research Laboratory Building',
        'hotel_caption': 'Conference Hotel',
        'section_register': 'Register',
        'section_poster': 'Poster',
        'day1_morning': 'June 14 Morning',
        'lect_1': '(1) 09:10-09:40 Yuhao Zhang (Shanghai Jiao Tong University)',
        'lect_2': '(2) 09:40-10:10 Lie He (Shanghai University of Finance and Economics)',
        'lect_3': '(3) 11:00-11:30 Xuan Wu (Nanyang Technological University)',
        'lect_4': '(4) 11:30-12:00 Shaofeng Jiang (Peking University)',
        'bio_jiang_shaofeng': 'Shaofeng Jiang is an Assistant Professor at the Center on Frontiers of Computing Studies, Peking University, and a Boya Young Scholar. He received his Ph.D. from the University of Hong Kong and served as a postdoctoral researcher and assistant professor at the Weizmann Institute of Science and Aalto University. His research interests lie in theoretical computer science, with a focus on big-data algorithms, approximation algorithms, and online algorithms for combinatorial optimization. His work has appeared in leading TCS journals and conferences, including SICOMP, TALG, STOC, FOCS, and SODA.',
        'day1_afternoon': 'June 14 Afternoon',
        'lect_5': '(5) 14:00-14:30 Ran Duan (Tsinghua University)',
        'lect_6': '(6) 14:30-15:00 Yijia Chen (Shanghai Jiao Tong University)',
        'bio_chen_yijia': 'Yijia Chen is a Professor in the Department of Computer Science at Shanghai Jiao Tong University. He received his Ph.D. in software theory from Shanghai Jiao Tong University and his Ph.D. in mathematics from the University of Freiburg. His research interests lie at the intersection of computer science and mathematics, including logic, algorithms, and computational complexity.',
        'lect_7': '(7) 15:00-15:30 Han Zhao (University of Illinois Urbana-Champaign)',
        'lect_8': '(8) 16:30-17:00 Xiao Liang (The Chinese University of Hong Kong)',
        'lect_9': '(9) 17:00-17:30 Yuan Li (Fudan University)',
        'lect_10': '(10) 17:30-18:00 Xue Chen (University of Science and Technology of China)',
        'day2_morning': 'June 15 Morning',
        'lect_11': '(11) 09:00-09:30 Kai Han (Shanghai University of Finance and Economics)',
        'lect_12': '(12) 09:30-10:00 Yiding Feng (Hong Kong University of Science and Technology)',
        'lect_13': '(13) 11:00-11:30 Shuai Li (Shanghai Jiao Tong University)',
        'bio_li_shuai': 'Associate Professor Shuai Li studies reinforcement learning theory and methods for autonomous decision-making in dynamic environments. He serves as the Deputy Director of the John Hopcroft Center for Computer Science at Shanghai Jiao Tong University. He has published over 90 academic papers, including SJTU\'s first COLT paper. He has served as Area Chair and SPC for top conferences like ICML, NeurIPS, UAI, ACL, IJCAI, and AAMAS. He has given tutorials on multi-agent online learning and foundations of Markov games at AAMAS (consecutive years) and IJCAI. He holds grants from the National Natural Science Foundation of China and Ministry of Science and Technology 2030 AI Project. He has received awards including AAAI-IAAI Deployed Application Award, Shanghai Yangfan Talent Plan, Shanghai Xuhui Guangqi Talent, Google PhD Fellowship, HK Government Outreach Award, Huawei Spark Award, SAT Competition Bronze Medal, and Tencent Excellent Mentor Award.',
        'lect_14': '(14) 11:30-12:00 Yaonan Jin (Huawei)',
        'section_organization': 'Organization',
        'host_unit': 'Organizer: Institute for Theoretical Computer Science (ITCS), Shanghai University of Finance and Economics',
        'co_host_unit': 'Co-organizer: Key Laboratory of Computational Economics and Interdisciplinary Sciences',
        'contact_email': 'Contact: liang.huili@sufe.edu.cn'
    },
    'zh': {
        'nav_home': '首页',
        'breadcrumb_home': '首页',
        'breadcrumb_workshop': '十周年研讨会',
        'nav_programs_events': '活动项目',
        'nav_workshop': '十周年研讨会',
        'nav_about': '关于 ITCS',
        'nav_research': '科学研究',
        'nav_contact': '联系我们 & 交通指南',
        'nav_background': '活动背景',
        'nav_schedule': '日程安排',
        'nav_speakers': '主讲嘉宾',
        'nav_register': '注册报名',
        'nav_poster': '墙报',
        'nav_org': '组织机构',
        'home_itcs_intro_title': '关于 ITCS',
        'home_itcs_intro_content': '上海财经大学理论计算机科学研究中心（ITCS）是上海财经大学新成立的学术单位，旨在为理论计算机科学的多样化研究创造世界一流的环境。上海财经大学是一所顶尖的研究型大学，专注于经济、金融和商业领域。近年来，上海财大不断向与财经相关的基础学科拓展，其中计算机科学和ITCS是学校的重点建设方向之一。ITCS成立于2016年，目前正值十周年校庆。',
        'home_anniversary_intro_title': '十周年庆典',
        'home_anniversary_intro_content': '2016年6月18日，上海财经大学理论计算机科学研究中心 (ITCS) 正式成立。2026年，我们迎来了中心的十周年华诞。为了庆祝这一重要时刻，我们将举办一系列学术活动和研讨会，回顾过去的成就，展望未来的发展。',

        'section_research': '科学研究',
        'research_content_1': 'ITCS的研究涵盖理论计算机科学的核心问题以及通过理论计算机科学视角审视的跨学科课题。我们在算法和复杂性基础问题上的工作包括通过二分定理对计算任务进行分类，以及近似算法的设计与分析。',
        'research_content_2': '在社会科学和经济学方面，我们的工作涵盖机制设计和计算博弈论领域的各种主题。在自然科学方面，我们在计算物理学方面的工作涉及复杂网络中相变的理论分析。我们的研究有助于机器学习、信息论和运筹学领域，并与工程和信息技术中的实际问题直接相关。',

        'section_contact_directions': '联系我们 & 交通指南',
        'address_title': '地址',
        'address_details': '上海财经大学理论计算机科学研究中心<br>信息管理与工程学院<br>上海财经大学<br>中国上海市杨浦区武东路100号 邮编：200433<br>联系电话：86-21-65901160<br>邮箱：itcs(AT)mail.shufe.edu.cn',

        'directions_title': '如何到达上海财经大学武东路校区',
        'directions_pudong_title': '浦东机场出发：',
        'directions_pudong_content': '请乘坐机场四线，在五角场站换乘99/749/713路公交车，在武川路武东路站下车。然后步行至武东路校区。',
        'directions_hongqiao_title': '虹桥机场/虹桥火车站出发：',
        'directions_hongqiao_content': '请乘坐地铁10号线，在江湾体育场站换乘819路公交车，在武川路政立路站下车。然后步行至武东路校区。',
        'directions_railway_title': '上海火车站出发：',
        'directions_railway_content': '请乘坐地铁3号线，在江湾镇站下车，然后乘坐出租车前往武东路校区。',

        'section_contact': '联系我们',
        'contact_email': '联系邮箱:liang.huili@mail.shufe.edu.cn',
        'section_background': '活动背景',
        'background_content': '2016年6月18日，上海财经大学理论计算机科学研究中心 (ITCS) 正式成立，转眼已迎来十周年。值此周年庆典之际，中心特举办理论计算机学术研讨会，诚邀各位新老朋友相聚交流，共同庆祝ITCS的十岁生日！',
        'event_date': '📅 活动时间：2026年6月19日-21日',
        'event_location': '📍 活动地点：上海财经大学武东路校区科研实验大楼一楼（上海市杨浦区）',
        'schedule_title': '日程安排 (2026 年 6 月 19 - 21 日)',
        'day1_label': '6 月 19 日 星期五',
        'table_time': '时间',
        'table_speaker': '报告人',
        'table_topic': '报告内容',
        'table_host': '主持人',
        'schedule_tbd': '待定',
        'speaker_zhang_yuhao': '张宇昊',
        'host_fu_hu': '伏虎',
        'speaker_he_lie': '贺烈',
        'tea_break': '茶歇',
        'speaker_wu_xuan': '吴旋',
        'host_wang_xiao': '王晓',
        'speaker_jiang_shaofeng': '姜少峰',
        'lunch': '午餐',
        'staff_canteen': '教工食堂',
        'day2_label': '6 月 20 日 星期六',
        'speaker_duan_ran': '段然',
        'host_tang_zhihao': '唐志皓',
        'speaker_chen_yijia': '陈翌佳',
        'speaker_zhao_han': '赵晗',
        'tea_break_photo': '茶歇 & 集体照',
        'speaker_liang_xiao': '梁宵',
        'host_tao_yixin': '陶亦心',
        'speaker_li_yuan': '李元',
        'speaker_chen_xue': '陈雪',
        'dinner': '晚餐',
        'day3_label': '6 月 21 日 星期日',
        'speaker_han_kai': '韩恺',
        'host_guo_zichao': '郭子超',
        'speaker_feng_yiding': '冯逸丁',
        'speaker_li_shuai': '李帅',
        'host_xu_renzhe': '徐韧喆',
        'speaker_jin_yaonan': '金耀楠',
        'section_speakers': '主讲嘉宾',
        'label_title': '报告题目',
        'label_abstract': '摘要',
        'label_bio': '个人简介',
        'research_building_caption': '科研实验大楼',
        'hotel_caption': '会议酒店',
        'section_register': '注册报名',
        'section_poster': '墙报',
        'day1_morning': '6 月 14 日 上午',
        'lect_1': '（一）09:10-09:40 张宇昊（上海交通大学）',
        'lect_2': '（二）09:40-10:10 贺烈（上海财经大学）',
        'lect_3': '（三）11:00-11:30 吴旋（南洋理工大学）',
        'lect_4': '（四）11:30-12:00 姜少峰（北京大学）',
        'bio_jiang_shaofeng': '姜少峰博士现任北京大学前沿计算研究中心助理教授，北京大学博雅青年学者。他博士毕业于香港大学，并先后在以色列魏茨曼科学院和芬兰阿尔托大学担任博士后研究员及助理教授。他的研究领域是理论计算机科学，侧重于组合优化问题的大数据算法、近似算法和在线算法。他的多篇研究发表于SICOMP、TALG、STOC、FOCS、SODA等理论计算机科学方向的顶级期刊与会议上。',
        'day1_afternoon': '6 月 14 日 下午',
        'lect_5': '（五）14:00-14:30 段然（清华大学）',
        'lect_6': '（六）14:30-15:00 陈翌佳（上海交通大学）',
        'bio_chen_yijia': '陈翌佳目前是上海交通大学计算机系教授。他在上海交通大学获得软件与理论专业博士、德国弗莱堡大学数学博士。他的主要研究兴趣为计算机与数学的交叉领域，包括逻辑、算法与计算复杂性。',
        'lect_7': '（七）15:00-15:30 赵晗（University of Illinois Urbana-Champaign）',
        'lect_8': '（八）16:30-17:00 梁宵（香港中文大学）',
        'lect_9': '（九）17:00-17:30 李元（复旦大学）',
        'lect_10': '（十）17:30-18:00 陈雪（中国科学技术大学）',
        'day2_morning': '6 月 15 日 上午',
        'lect_11': '（十一）09:00-09:30 韩恺（上海财经大学）',
        'lect_12': '（十二）09:30-10:00 冯逸丁（香港科技大学）',
        'lect_13': '（十三）11:00-11:30 李帅（上海交通大学）',
        'bio_li_shuai': '李帅副教授研究可自主决策适应动态环境的强化学习理论与方法，任上海交通大学约翰·霍普克罗夫特计算机科学中心副主任，迄今共发表学术论文90+篇，包含上海交通大学首篇机器学习理论顶会COLT论文等，其中第一/通讯作者发表CCF-A类论文40+篇，10余项理论提升成果仍保持理论最优。她担任机器学习顶会ICML、NeurIPS、UAI、ACL、IJCAI、AAMAS的领域主席（Area Chair）与高级程序委员会委员（SPC），受邀于群体智能顶级会议AAMAS上给出多智能体在线学习与马尔可夫博弈理论基础的教程（连续两年）和IJCAI上给出多智能体在线学习的教程，主持国自然面上基金、青年基金，参与国自然重大研究计划、科技部2030新一代人工智能重大项目。她曾获得AAAI-IAAI Deployed Application Award、上海市扬帆人才计划、上海徐汇光启人才、谷歌博士奖学金、香港政府外展合作奖、华为火花奖、国际SAT竞赛并行求解赛道铜牌、腾讯优秀导师奖等。',
        'lect_14': '（十四）11:30-12:00 金耀楠（华为）',
        'section_organization': '组织机构',
        'host_unit': '承办单位：上海财经大学理论计算机科学研究中心（ITCS）',
        'co_host_unit': '协办单位：计算经济交叉科学教育部重点实验室',
        'contact_email': '联系邮箱：liang.huili@sufe.edu.cn'
    }
};

document.addEventListener('DOMContentLoaded', function () {
    // Language Toggle Logic
    const langToggle = document.getElementById('lang-toggle');
    const storedLang = localStorage.getItem('site_lang') || 'en';

    // Initial load
    setLanguage(storedLang);

    if (langToggle) {
        langToggle.addEventListener('click', function () {
            const currentLang = document.documentElement.lang || 'en';
            const newLang = currentLang === 'en' ? 'zh' : 'en';
            setLanguage(newLang);
        });
    }

    function setLanguage(lang) {
        document.documentElement.lang = lang;
        localStorage.setItem('site_lang', lang);

        // Update Content
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.innerHTML = translations[lang][key];
            }
        });

        // Update Toggle Button Text
        if (langToggle) {
            langToggle.innerText = lang === 'en' ? '中文' : 'English';
        }
    }
});
