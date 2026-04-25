// ==UserScript==
// @name         ESP Bounding Box (Wallhack) Logic - Education Only
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Vẽ khung bao quanh kẻ địch trong môi trường game WebGL 3D
// @author       You
// @match        *://link-game-cua-ban.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // PHẦN 1: KHỞI TẠO LỚP VẼ (OVERLAY CANVAS)
    // ==========================================
    const canvas = document.createElement('canvas');
    canvas.id = 'espCanvas';
    canvas.style.cssText = 'position:absolute; top:0; left:0; pointer-events:none; z-index:9999;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Cập nhật kích thước canvas khi xoay màn hình điện thoại
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // ==========================================
    // PHẦN 2: THUẬT TOÁN 3D (WORLD TO SCREEN)
    // ==========================================
    
    // Ma trận này dùng để chuyển đổi tọa độ, bạn phải tự tìm offset trong game
    let viewProjectionMatrix = new Float32Array(16); 

    function worldToScreen(worldPos, matrix) {
        // Phép nhân ma trận vector để đưa điểm 3D về Clip Space
        const w = matrix[3] * worldPos.x + matrix[7] * worldPos.y + matrix[11] * worldPos.z + matrix[15];
        
        // Nếu w < 0.1, đối tượng nằm sau lưng camera
        if (w < 0.1) return { x: 0, y: 0, visible: false };

        const x = (matrix[0] * worldPos.x + matrix[4] * worldPos.y + matrix[8] * worldPos.z + matrix[12]) / w;
        const y = (matrix[1] * worldPos.x + matrix[5] * worldPos.y + matrix[9] * worldPos.z + matrix[13]) / w;

        // Chuyển sang tọa độ pixel màn hình
        return {
            x: (x + 1) * window.innerWidth / 2,
            y: (1 - y) * window.innerHeight / 2,
            visible: true
        };
    }

    // ==========================================
    // PHẦN 3: VÒNG LẶP RENDER (MAIN LOOP)
    // ==========================================

    // Giả lập danh sách kẻ địch, bạn cần tìm địa chỉ thật của danh sách này
    let enemies = [
        { id: 1, pos: { x: 10, y: 0, z: 50 }, health: 100 },
        { id: 2, pos: { x: -20, y: 0, z: 80 }, health: 50 }
    ];

    function renderESP() {
        // 1. Xóa canvas cũ
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Cập nhật Ma trận (Matrix) từ game (bạn phải hack để lấy matrix này)
        // updateMatrixFromGameMemory(viewProjectionMatrix); 

        // 3. Vẽ khung cho từng kẻ địch
        enemies.forEach(enemy => {
            const screenPos = worldToScreen(enemy.pos, viewProjectionMatrix);

            if (screenPos.visible) {
                // Tính toán kích thước khung dựa trên độ sâu (w)
                const distance = Math.sqrt(enemy.pos.x**2 + enemy.pos.y**2 + enemy.pos.z**2); // Giả lập khoảng cách
                const boxHeight = 1000 / distance; // Càng xa càng nhỏ
                const boxWidth = boxHeight / 1.6;  // Tỷ lệ khung hình người

                // Vẽ Bounding Box (Màu đỏ xuyên tường)
                ctx.strokeStyle = enemy.health > 20 ? 'red' : 'yellow';
                ctx.lineWidth = 2;
                ctx.strokeRect(screenPos.x - boxWidth/2, screenPos.y - boxHeight, boxWidth, boxHeight);

                // Vẽ Thanh máu (Health Bar)
                ctx.fillStyle = 'lime';
                ctx.fillRect(screenPos.x - boxWidth/2 - 5, screenPos.y - boxHeight + (1 - enemy.health/100)*boxHeight, 3, (enemy.health/100)*boxHeight);

                // Vẽ Thông tin (Tên/Khoảng cách)
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.fillText(`ENEMY [${Math.round(distance)}m]`, screenPos.x - boxWidth/2, screenPos.y - boxHeight - 5);
            }
        });

        // Tự động gọi lại hàm vẽ ở khung hình tiếp theo
        requestAnimationFrame(renderESP);
    }

    // Bắt đầu vòng lặp
    renderESP();

})();
