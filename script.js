document.addEventListener("DOMContentLoaded", () => {
    // Slideshow Modal
    const modal = document.getElementById("slideshow-modal");
    const methodBtn = document.getElementById("method-button");
    const closeBtn = document.querySelector(".close-button");
    const slides = document.querySelectorAll(".slide");
    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");
    const initialUploadWrapper = document.getElementById("upload-initial");
    const afterConfirmWrapper = document.getElementById("upload-after-confirm");

    let currentSlide = 0;

    methodBtn.addEventListener("click", () => {
        modal.classList.add("show");
        modal.classList.remove("hidden");
        showSlide(0);
    });

    closeBtn.addEventListener("click", () => {
        modal.classList.remove("show");
        modal.classList.add("hidden");
    });

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle("active", i === index);
        });
        currentSlide = index;
    }

    prevBtn.addEventListener("click", () => {
        const prev = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prev);
    });

    nextBtn.addEventListener("click", () => {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    });

    let accuracyChart = null;
    let imageFiles = [];
    let imagesLabeledSoFar = 0;

    const imageUpload = document.getElementById("image-upload");
    const previewContainer = document.getElementById("image-preview");
    const confirmButton = document.getElementById("confirm-order");
    const uploadCountDisplay = document.getElementById("upload-count");
    const tuningInput = document.getElementById("tuning-parameter");

    const addMoreBtn = document.getElementById("add-more-images");
    const confirmAddedBtn = document.getElementById("confirm-added-images");
    const additionalUpload = document.getElementById("additional-upload");

    function checkReadyToProceed() {
        const hasTuning = tuningInput.value.trim() !== "";
        const hasImages = imageFiles.length > 0;
        const uploadStepContainer = document.getElementById("image-upload-step");
        uploadStepContainer.style.display = hasTuning && hasImages ? "block" : "none";
        confirmButton.disabled = !(hasTuning && hasImages);
    }

    tuningInput.addEventListener("input", checkReadyToProceed);

    imageUpload.addEventListener("change", () => {
        const newFiles = Array.from(imageUpload.files);
        for (const file of newFiles) {
            const isDuplicate = imageFiles.some(existing =>
                existing.name === file.name && existing.lastModified === file.lastModified
            );
            if (!isDuplicate) imageFiles.push(file);
        }

        uploadCountDisplay.textContent = `Images uploaded: ${imageFiles.length}`;
        renderImages();
        checkReadyToProceed();
        imageUpload.value = '';
    });

    function renderImages() {
        previewContainer.innerHTML = "";
        imageFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                const div = document.createElement("div");
                div.classList.add("image-box");
                div.innerHTML = `<img src="${reader.result}" />`;
                previewContainer.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    }

    window.moveImage = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < imageFiles.length) {
            const temp = imageFiles[index];
            imageFiles[index] = imageFiles[newIndex];
            imageFiles[newIndex] = temp;
            renderImages();
        }
    };

    confirmButton.addEventListener("click", () => {
        document.querySelector(".image-upload-section").style.display = "none";
        initialUploadWrapper.classList.add("hidden");
        afterConfirmWrapper.classList.remove("hidden");

        const labelingSection = document.getElementById("image-labeling-section");
        const labelingList = document.getElementById("labeling-list");
        labelingSection.classList.remove("hidden");
        labelingList.innerHTML = "";
        imagesLabeledSoFar = 0;

        imageFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = () => {
                const row = document.createElement("div");
                row.classList.add("labeling-row");
                row.innerHTML = `
                    <img src="${reader.result}" alt="Uploaded Image ${index + 1}" />
                    <input type="number" placeholder="Enter value..." class="tuning-input" data-index="${index}" required />
                `;
                labelingList.appendChild(row);
                imagesLabeledSoFar++;
            };
            reader.readAsDataURL(file);
        });
    });

    addMoreBtn.addEventListener("click", () => {
        additionalUpload.click();
    });

    additionalUpload.addEventListener("change", () => {
        const newFiles = Array.from(additionalUpload.files);
        let added = false;

        for (const file of newFiles) {
            const isDuplicate = imageFiles.some(existing =>
                existing.name === file.name && existing.lastModified === file.lastModified
            );
            if (!isDuplicate) {
                imageFiles.push(file);
                added = true;
            }
        }

        if (added) {
            confirmAddedBtn.classList.remove("hidden");
        }

        additionalUpload.value = '';
    });

    confirmAddedBtn.addEventListener("click", () => {
        const labelingList = document.getElementById("labeling-list");
        const filesToRender = imageFiles.slice(imagesLabeledSoFar);

        filesToRender.forEach((file, indexOffset) => {
            const index = imagesLabeledSoFar + indexOffset;
            const reader = new FileReader();
            reader.onload = () => {
                const row = document.createElement("div");
                row.classList.add("labeling-row");
                row.innerHTML = `
                    <img src="${reader.result}" alt="Added Image ${index + 1}" />
                    <input type="number" placeholder="Enter value..." class="tuning-input" data-index="${index}" required />
                `;
                labelingList.appendChild(row);
            };
            reader.readAsDataURL(file);
        });

        imagesLabeledSoFar = imageFiles.length;
        confirmAddedBtn.classList.add("hidden");
    });

    document.getElementById("submit-labels").addEventListener("click", () => {
        const formData = new FormData();
        let valid = true;

        imageFiles.forEach((file, index) => {
            const input = document.querySelector(`.tuning-input[data-index="${index}"]`);
            const tuningValue = input.value.trim();
            if (!tuningValue) {
                alert(`Missing tuning value for image ${index + 1}`);
                valid = false;
                return;
            }
            formData.append("images", file);
            formData.append("tuning_values", tuningValue);
        });

        if (!valid) return;

        fetch("http://localhost:5000/api/submit", {
            method: "POST",
            body: formData
        })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            alert("Data submitted successfully!");
            const ctx = document.getElementById("accuracyChart").getContext("2d");
            if (accuracyChart) accuracyChart.destroy();

            const minAcc = Math.min(...data.accuracies);
            const maxAcc = Math.max(...data.accuracies);
            const buffer = 0.05;

            accuracyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.Tc_candidates,
                    datasets: [{
                        label: 'Accuracy vs Tc',
                        data: data.accuracies,
                        borderColor: 'blue',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.3,
                        pointRadius: 4,
                        pointBackgroundColor: 'blue'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: `Estimated Critical Point: Tc ≈ ${data.shape_analysis.center_guess}`
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Tc Candidate'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Accuracy'
                            },
                            min: Math.max(0, minAcc - buffer),
                            max: Math.min(1, maxAcc + buffer)
                        }
                    }
                }
            });
        })
        .catch(err => {
            console.error("Submission error:", err);
            alert("Submission failed.");
        });
    });
});

