import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./Photos.css"
const APP_URL = import.meta.env.VITE_APP_URL;

function Photos() {
  const {tripId} = useParams();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [trip, setTrip] = useState(null);

  // Fetch trip details
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await fetch(`${APP_URL}/trips/${tripId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch trip");
        }
        const data = await response.json();
        setTrip(data);
      } catch (error) {
        console.error("Error fetching trip:", error);
      }
    };

    fetchTrip();
  }, [tripId]);

  // Fetch photos for the trip
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch(`${APP_URL}/trips/${tripId}/photos`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch photos");
        }
        const data = await response.json();
        setPhotos(data);
      } catch (error) {
        console.error("Error fetching photos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [tripId]);

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle photo upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("photo", selectedFile);
    formData.append("caption", caption);

    try {
      const response = await fetch(`${APP_URL}/trips/${tripId}/photos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      const newPhoto = await response.json();
      setPhotos([newPhoto, ...photos]);
      setSelectedFile(null);
      setCaption("");
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Handle photo deletion
  const handleDelete = async (photoId) => {
    if (!confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    try {
      const response = await fetch(
        `${APP_URL}/trips/${tripId}/photos/${photoId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete photo");
      }

      setPhotos(photos.filter((photo) => photo.id !== photoId));
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo. Please try again.");
    }
  };

  // Open modal to view/edit photo
  const openPhotoModal = (photo) => {
    setSelectedPhoto(photo);
    setEditCaption(photo.caption || "");
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedPhoto(null);
    setEditCaption("");
  };

  // Update photo caption
  const updateCaption = async () => {
    if (!selectedPhoto) return;

    try {
      const response = await fetch(
        `${APP_URL}/trips/${tripId}/photos/${selectedPhoto.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ caption: editCaption }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update caption");
      }

      const updatedPhoto = await response.json();
      setPhotos(
        photos.map((photo) =>
          photo.id === updatedPhoto.id ? updatedPhoto : photo
        )
      );
      closeModal();
    } catch (error) {
      console.error("Error updating caption:", error);
      alert("Failed to update caption. Please try again.");
    }
  };

  if (loading) {
    return <div className="loading">Loading photos...</div>;
  }

  return (
    <div className="photos-page">
      {/* Photo upload form */}
      <div className="photo-upload-form">
        <h4>Add a New Photo</h4>
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label htmlFor="photo">Select Photo:</label>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="caption">Caption (optional):</label>
            <input
              type="text"
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={uploading}
              placeholder="Add a caption"
            />
          </div>
          <button type="submit" disabled={uploading || !selectedFile}>
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>
        </form>
      </div>

      {/* Photo grid */}
      <div className="photo-grid">
        {photos.length === 0 ? (
          ""
        ) : (
          photos.map((photo) => (
            <div key={photo.id} className="photo-item">
              <div className="photo-container" onClick={() => openPhotoModal(photo)}>
                <img src={APP_URL + photo.url} alt={photo.caption || "Trip photo"} />
                {photo.caption && <div className="photo-caption">{photo.caption}</div>}
              </div>
              <button
                className="delete-photo"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(photo.id);
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {/* Photo modal */}
      {showModal && selectedPhoto && (
        <div className="photo-modal-overlay" onClick={closeModal}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={closeModal}>
              &times;
            </span>
            <img
              src={APP_URL + selectedPhoto.url}
              alt={selectedPhoto.caption || "Trip photo"}
              className="modal-image"
            />
            <div className="modal-caption-form">
              <input
                type="text"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Add or edit caption"
              />
              <button onClick={updateCaption}>Save Caption</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Photos;