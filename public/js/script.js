// Bootstrap form validation
(() => {
    'use strict';
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                const firstInvalidField = form.querySelector(":invalid");
                if (firstInvalidField) {
                    firstInvalidField.focus();
                }
            } else {
                const submitButton = form.querySelector(".submit-button");
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = "Please wait...";
                }
            }
            form.classList.add('was-validated');
        }, false);
    });
})();
