const fileInput = document.getElementById("file-input");
const uploadButton = document.getElementById("upload-button");
const fileList = document.getElementById("file-list");
const clearButton = document.getElementById("clear-button");
const uploadedFiles = new Set(); 

uploadButton.addEventListener("click", () => {
  const files = fileInput.files;
  if (files.length === 0) {
    alert("Please select at least one file to upload.");
    return;
  }

  const file = files[0]; 

  if (!uploadedFiles.has(file.name)) {
    const formData = new FormData();
    formData.append('file', file); 

    showLoading(); 

    fetch('/api/upload/', {
      method: 'POST',
      body: formData, 
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json(); 
    })
    .then(data => {
      hideLoading();
      alert(data.message); 
      addFileToList(file.name); 
      uploadedFiles.add(file.name); 
    })
    .catch(error => {
      hideLoading(); 
      console.error('Error:', error);
      alert('There was a problem with the upload: ' + error.message);
    });

    fileInput.value = ""; 
  } else {
    alert(`File "${file.name}" is already uploaded.`);
  }
});


function addFileToList(filename) {
  const fileItem = document.createElement("div");
  fileItem.classList.add("file-item");

  const fileName = document.createElement("span");
  fileName.textContent = filename;

  const downloadLink = document.createElement("a");
  downloadLink.textContent = "Download";
  downloadLink.style.marginRight = "10px"; 

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.classList.add("delete-button");
  deleteButton.onclick = () => {
    fetch(`/api/delete/?filename=${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      return response.json();
    })
    .then(data => {
      alert(data.message); 
      fileItem.remove();
      uploadedFiles.delete(filename); 
    })
    .catch(error => {
      console.error('Error:', error);
      alert('There was a problem with the deletion: ' + error.message);
    });
  };

  fileItem.appendChild(fileName);
  fileItem.appendChild(downloadLink);
  fileItem.appendChild(deleteButton);
  fileList.appendChild(fileItem);
}

clearButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear all files? This action cannot be undone.")) {
    fetch('/api/delete_all/', { 
      method: 'DELETE',
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete all documents');
      }
      return response.json();
    })
    .then(data => {
      alert(data.message); 
      while (fileList.children.length > 1) { 
        const fileItem = fileList.lastElementChild;
        const downloadLink = fileItem.querySelector("a");
        if (downloadLink) URL.revokeObjectURL(downloadLink.href); 
        fileItem.remove();
      }
      uploadedFiles.clear(); 
    })
    .catch(error => {
      console.error('Error:', error);
      alert('There was a problem with the deletion: ' + error.message);
    });
  }
});


function showLoading() {
  const loadingOverlay = document.createElement("div");
  loadingOverlay.id = "loading-overlay";
  loadingOverlay.style.position = "fixed";
  loadingOverlay.style.top = "0";
  loadingOverlay.style.left = "0";
  loadingOverlay.style.width = "100%";
  loadingOverlay.style.height = "100%";
  loadingOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  loadingOverlay.style.display = "flex";
  loadingOverlay.style.alignItems = "center";
  loadingOverlay.style.justifyContent = "center";
  loadingOverlay.style.zIndex = "1000"; 
  loadingOverlay.innerHTML = "<div class='loader'>Loading...</div>"; 
  document.body.appendChild(loadingOverlay);
}

function hideLoading() {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
      loadingOverlay.remove();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetch('/api/list_uploaded_files/') 
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load files');
      }
      return response.json();
    })
    .then(data => {
      fileList.innerHTML = ''; 

      data.files.forEach(file => {
        addFileToList(file);
        uploadedFiles.add(file); 
      });
    })
    .catch(error => {
      console.error('Error:', error);
      alert('There was a problem loading the files: ' + error.message);
    });
});
