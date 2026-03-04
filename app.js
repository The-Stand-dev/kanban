// ===== Firebase Realtime Sync =====
const cardsRef = db.ref('cards');
let cards = [];

// Listen for real-time changes from Firebase
cardsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    cards = data ? Object.values(data) : [];
    renderBoard();
});

function saveCard(card) {
    return cardsRef.child(card.id).set(card);
}

function deleteCardFromDB(id) {
    return cardsRef.child(id).remove();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ===== State =====

// ===== DOM Elements =====
const boardEl = document.querySelector('.board');
const modalOverlay = document.getElementById('modalOverlay');
const cardForm = document.getElementById('cardForm');
const cardIdInput = document.getElementById('cardId');
const cardTitleInput = document.getElementById('cardTitleInput');
const cardDescription = document.getElementById('cardDescription');
const cardAssignee = document.getElementById('cardAssignee');
const cardPole = document.getElementById('cardPole');
const cardStatus = document.getElementById('cardStatus');
const modalTitle = document.getElementById('modalTitle');
const btnDelete = document.getElementById('btnDelete');
const btnAddCard = document.getElementById('btnAddCard');
const btnCancel = document.getElementById('btnCancel');
const modalClose = document.getElementById('modalClose');

// ===== Pole labels =====
const poleLabels = {
    dev: 'Dev',
    uiux: 'UI-UX',
    branding: 'Branding',
    marketing: 'Marketing',
    audiovisuel: 'Audiovisuel'
};

// ===== Rendering =====
function renderBoard() {
    const statuses = ['new', 'validated', 'in-progress', 'to-be-tested', 'done'];

    statuses.forEach(status => {
        const container = document.querySelector(`.column-cards[data-status="${status}"]`);
        const countEl = document.querySelector(`[data-count="${status}"]`);
        const statusCards = cards.filter(c => c.status === status);

        countEl.textContent = statusCards.length;
        container.innerHTML = '';

        statusCards.forEach(card => {
            container.appendChild(createCardElement(card));
        });
    });
}

function createCardElement(card) {
    const el = document.createElement('div');
    el.classList.add('card');
    el.setAttribute('draggable', 'true');
    el.dataset.id = card.id;

    const initials = getInitials(card.assignee);

    el.innerHTML = `
        <div class="card-pole-bar pole-${card.pole}"></div>
        <div class="card-title">${escapeHtml(card.title)}</div>
        ${card.description ? `<div class="card-description">${escapeHtml(card.description)}</div>` : ''}
        <div class="card-meta">
            <div class="card-assignee">
                ${card.assignee ? `<span class="avatar">${initials}</span><span>${escapeHtml(card.assignee)}</span>` : '<span style="opacity:.4;">Non assigné</span>'}
            </div>
            <span class="card-pole-badge badge-${card.pole}">${poleLabels[card.pole] || card.pole}</span>
        </div>
    `;

    // Click to edit
    el.addEventListener('click', (e) => {
        if (el.classList.contains('dragging')) return;
        openModal(card);
    });

    // Drag events
    el.addEventListener('dragstart', handleDragStart);
    el.addEventListener('dragend', handleDragEnd);

    return el;
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== Drag & Drop =====
let draggedCard = null;
let draggedEl = null;
let placeholder = null;

function handleDragStart(e) {
    draggedEl = e.target.closest('.card');
    draggedCard = cards.find(c => c.id === draggedEl.dataset.id);

    // Delay adding class for visual effect
    requestAnimationFrame(() => {
        draggedEl.classList.add('dragging');
    });

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedCard.id);

    // Create placeholder
    placeholder = document.createElement('div');
    placeholder.classList.add('drop-placeholder');
}

function handleDragEnd(e) {
    if (draggedEl) {
        draggedEl.classList.remove('dragging');
    }
    removePlaceholder();
    removeAllDragOver();
    draggedCard = null;
    draggedEl = null;
}

function removePlaceholder() {
    if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
    }
}

function removeAllDragOver() {
    document.querySelectorAll('.column-cards').forEach(col => {
        col.classList.remove('drag-over');
    });
}

// Column drag events
document.querySelectorAll('.column-cards').forEach(columnCards => {
    columnCards.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (!draggedCard) return;

        removeAllDragOver();
        columnCards.classList.add('drag-over');

        // Position placeholder
        const afterElement = getDragAfterElement(columnCards, e.clientY);
        removePlaceholder();

        if (afterElement) {
            columnCards.insertBefore(placeholder, afterElement);
        } else {
            columnCards.appendChild(placeholder);
        }
    });

    columnCards.addEventListener('dragleave', (e) => {
        // Only remove if leaving the column entirely
        if (!columnCards.contains(e.relatedTarget)) {
            columnCards.classList.remove('drag-over');
        }
    });

    columnCards.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedCard) return;

        const newStatus = columnCards.dataset.status;
        const afterElement = getDragAfterElement(columnCards, e.clientY);

        // Update status and save to Firebase
        draggedCard.status = newStatus;
        saveCard(draggedCard);

        removeAllDragOver();
        removePlaceholder();
    });
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];

    let closest = null;
    let closestOffset = Number.NEGATIVE_INFINITY;

    draggableElements.forEach(child => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closestOffset) {
            closestOffset = offset;
            closest = child;
        }
    });

    return closest;
}

// ===== Modal =====
function openModal(card = null) {
    if (card) {
        // Edit mode
        modalTitle.textContent = 'Modifier la carte';
        cardIdInput.value = card.id;
        cardTitleInput.value = card.title;
        cardDescription.value = card.description || '';
        cardAssignee.value = card.assignee || '';
        cardPole.value = card.pole;
        cardStatus.value = card.status;
        btnDelete.style.display = 'inline-flex';
    } else {
        // Create mode
        modalTitle.textContent = 'Nouvelle carte';
        cardForm.reset();
        cardIdInput.value = '';
        cardStatus.value = 'new';
        btnDelete.style.display = 'none';
    }

    modalOverlay.classList.add('active');
    setTimeout(() => cardTitleInput.focus(), 100);
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

// ===== Events =====
btnAddCard.addEventListener('click', () => openModal());
btnCancel.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

cardForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = cardIdInput.value;
    const title = cardTitleInput.value.trim();
    if (!title) return;

    const cardData = {
        title,
        description: cardDescription.value.trim(),
        assignee: cardAssignee.value.trim(),
        pole: cardPole.value,
        status: cardStatus.value
    };

    const cardToSave = {
        id: id || generateId(),
        ...cardData
    };

    // Save to Firebase (real-time listener will update the board)
    saveCard(cardToSave);
    closeModal();
});

btnDelete.addEventListener('click', () => {
    const id = cardIdInput.value;
    if (!id) return;

    if (confirm('Supprimer cette carte ?')) {
        deleteCardFromDB(id);
        closeModal();
    }
});

// ===== Touch Drag & Drop (mobile support) =====
let touchDragEl = null;
let touchClone = null;
let touchStartX, touchStartY;
let touchMoved = false;
const TOUCH_THRESHOLD = 10;

document.addEventListener('touchstart', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;

    touchDragEl = card;
    touchMoved = false;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    draggedCard = cards.find(c => c.id === card.dataset.id);
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (!touchDragEl || !draggedCard) return;

    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (!touchMoved && Math.abs(dx) + Math.abs(dy) < TOUCH_THRESHOLD) return;
    touchMoved = true;

    e.preventDefault();

    if (!touchClone) {
        touchClone = touchDragEl.cloneNode(true);
        touchClone.style.position = 'fixed';
        touchClone.style.zIndex = '1000';
        touchClone.style.width = touchDragEl.offsetWidth + 'px';
        touchClone.style.pointerEvents = 'none';
        touchClone.style.opacity = '0.85';
        touchClone.style.transform = 'rotate(3deg)';
        document.body.appendChild(touchClone);

        touchDragEl.classList.add('dragging');

        placeholder = document.createElement('div');
        placeholder.classList.add('drop-placeholder');
    }

    touchClone.style.left = (touch.clientX - touchDragEl.offsetWidth / 2) + 'px';
    touchClone.style.top = (touch.clientY - 20) + 'px';

    // Find column under touch point
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!elemBelow) return;

    const columnCards = elemBelow.closest('.column-cards');
    if (columnCards) {
        removeAllDragOver();
        columnCards.classList.add('drag-over');

        const afterElement = getDragAfterElement(columnCards, touch.clientY);
        removePlaceholder();

        if (afterElement) {
            columnCards.insertBefore(placeholder, afterElement);
        } else {
            columnCards.appendChild(placeholder);
        }
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (!touchDragEl || !draggedCard) return;

    if (touchClone) {
        // Find drop target
        const touch = e.changedTouches[0];
        if (touchClone.style.display !== 'none') {
            touchClone.style.display = 'none';
        }
        const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        if (touchClone.parentNode) {
            touchClone.parentNode.removeChild(touchClone);
        }

        if (elemBelow) {
            const columnCards = elemBelow.closest('.column-cards');
            if (columnCards) {
                const newStatus = columnCards.dataset.status;
                const afterElement = getDragAfterElement(columnCards, touch.clientY);

                draggedCard.status = newStatus;
                saveCard(draggedCard);
            }
        }
    } else if (!touchMoved) {
        // It was a tap, open modal
        openModal(draggedCard);
    }

    if (touchDragEl) touchDragEl.classList.remove('dragging');
    removeAllDragOver();
    removePlaceholder();

    touchDragEl = null;
    touchClone = null;
    draggedCard = null;
    placeholder = null;
}, { passive: true });

// ===== Init =====
// Board is rendered automatically by Firebase real-time listener
