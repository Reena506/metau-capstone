import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function Notes() {
  const { tripId } = useParams();
  const [notes, setNotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [form, setForm] = useState({
    title: "",
    content: ""
  });

  useEffect(() => {
    fetchNotes();
  }, [tripId]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`http://localhost:3000/trips/${tripId}/notes`, { 
        credentials: "include" 
      });
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingNote 
        ? `http://localhost:3000/trips/${tripId}/notes/${editingNote.id}`
        : `http://localhost:3000/trips/${tripId}/notes`;
      
      const method = editingNote ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(form)
      });

      if (response.ok) {
        fetchNotes(); 
        setShowModal(false);
        setEditingNote(null);
        setForm({
          title: "",
          content: ""
        });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save note");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note");
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setForm({
      title: note.title,
      content: note.content
    });
    setShowModal(true);
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      const response = await fetch(`http://localhost:3000/trips/${tripId}/notes/${noteId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note");
    }
  };

  return (
    <div>
      <div className="section-header">
        <h2>Notes</h2>
        <button 
          className="add-btn" 
          onClick={() => {
            setEditingNote(null);
            setForm({
              title: "",
              content: ""
            });
            setShowModal(true);
          }}
        >
          Add Note
        </button>
      </div>
      
      {notes.length === 0 ? (
        <p>No notes yet. Add your first note to get started!</p>
      ) : (
        <div className="notes-list">
          {notes.map((note) => (
            <div key={note.id} className="note-card">
              <div className="note-content">
                <h3>{note.title}</h3>
                <p className="note-text">{note.content}</p>
              </div>
              <div className="note-actions">
                <button onClick={() => handleEdit(note)}>Edit</button>
                <button onClick={() => handleDelete(note.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal">
          <form className="modal-content" onSubmit={handleSubmit}>
            <h3>{editingNote ? "Edit Note" : "Add New Note"}</h3>
            
            <label>
              Title:
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="Enter note title"
              />
            </label>

            <label>
              Content:
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Write your note content here..."
              />
            </label>

            <div style={{ marginTop: "1rem" }}>
              <button type="submit">
                {editingNote ? "Update Note" : "Create Note"}
              </button>
              <button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Notes;

