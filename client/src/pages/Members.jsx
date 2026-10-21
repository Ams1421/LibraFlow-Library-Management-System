
import { useCallback, useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import './Members.css'

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/members`;
const PAGE_SIZE = 10

const emptyForm = {
  name: '',
  email: '',
  phone: '',
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function Members() {
  const [members, setMembers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      })

      if (search) params.set('search', search)

      const response = await fetch(`${API_URL}?${params}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load members.')
      }

      setMembers(Array.isArray(result.data) ? result.data : [])
      setTotal(result.total ?? 0)
      setTotalPages(result.totalPages ?? 0)
    } catch (err) {
      setError(err.message || 'Unable to connect to the Members API.')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    // Load member data when the page or search criteria changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMembers()
  }, [loadMembers])

  const openAddModal = () => {
    setEditingMember(null)
    setForm(emptyForm)
    setError('')
    setNotice('')
    setModalOpen(true)
  }

  const openEditModal = (member) => {
    setEditingMember(member)
    setForm({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
    })
    setError('')
    setNotice('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (!saving) setModalOpen(false)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const saveMember = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      }

      if (!payload.name || !payload.email) {
        throw new Error('Name and email are required.')
      }

      const response = await fetch(
        editingMember ? `${API_URL}/${editingMember._id}` : API_URL,
        {
          method: editingMember ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to save the member.')
      }

      setModalOpen(false)
      setNotice(
        editingMember
          ? 'Member updated successfully.'
          : 'Member registered successfully.',
      )

      if (!editingMember) {
        setPage(1)
        setSearch('')
        setSearchInput('')
      } else {
        await loadMembers()
      }
    } catch (err) {
      setError(err.message || 'Unable to save the member.')
    } finally {
      setSaving(false)
    }
  }

  const deleteMember = async (member) => {
    const confirmed = window.confirm(
      `Delete member "${member.name}" (${member.email})?\n\nMembers with active book loans cannot be deleted.`,
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      const response = await fetch(`${API_URL}/${member._id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to delete the member.')
      }

      setNotice('Member deleted successfully.')

      if (members.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await loadMembers()
      }
    } catch (err) {
      setError(err.message || 'Unable to delete the member.')
    }
  }

  const firstRecord = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastRecord = Math.min(page * PAGE_SIZE, total)

  return (
    <section className="members-page">
      <div className="members-page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            MEMBER MANAGEMENT
          </div>
          <h1>Members</h1>
          <p className="members-subtitle">
            Manage registrations and keep member contact details up to date.
          </p>
        </div>

        <button className="button button-primary" onClick={openAddModal}>
          <Plus size={17} />
          Add member
        </button>
      </div>

      <div className="members-summary-grid">
        <article className="members-summary-card">
          <span className="members-summary-icon members-icon-blue">
            <Users size={21} />
          </span>
          <div>
            <span>Registered members</span>
            <strong>{total.toLocaleString('en-IN')}</strong>
          </div>
        </article>

        <article className="members-summary-card">
          <span className="members-summary-icon members-icon-purple">
            <UserRound size={21} />
          </span>
          <div>
            <span>Members on this page</span>
            <strong>{members.length}</strong>
          </div>
        </article>
      </div>

      {error && (
        <div className="members-alert members-alert-error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError('')} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="members-alert members-alert-success" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss notification">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="members-table-panel">
        <div className="members-toolbar">
          <div>
            <h2>Member directory</h2>
            <p>Search and manage registered library members.</p>
          </div>

          <form className="members-search" onSubmit={handleSearch}>
            <Search size={17} />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name, email or phone..."
              aria-label="Search members"
            />

            {searchInput && (
              <button
                type="button"
                className="members-clear-search"
                onClick={() => {
                  setSearchInput('')
                  setSearch('')
                  setPage(1)
                }}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}

            <button className="members-search-submit" type="submit">
              Search
            </button>
          </form>
        </div>

        <div className="members-table-scroll">
          <table className="members-table">
            <thead>
              <tr>
                <th>MEMBER DETAILS</th>
                <th>EMAIL ADDRESS</th>
                <th>PHONE</th>
                <th>JOINED DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {members.map((member) => (
                <tr key={member._id}>
                  <td>
                    <div className="member-name-cell">
                      <div className="member-avatar">
                        {(member.name || '?').trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="member-name-copy">
                        <strong>{member.name}</strong>
                        <span>Library member</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="member-contact">
                      <Mail size={15} />
                      <span>{member.email}</span>
                    </div>
                  </td>

                  <td>
                    <div className="member-contact">
                      <Phone size={14} />
                      <span>{member.phone || '—'}</span>
                    </div>
                  </td>

                  <td>{formatDate(member.membershipDate || member.createdAt)}</td>

                  <td>
                    <div className="members-row-actions">
                      <button
                        className="members-action-button"
                        title="Edit member"
                        aria-label={`Edit ${member.name}`}
                        onClick={() => openEditModal(member)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="members-action-button members-delete-button"
                        title="Delete member"
                        aria-label={`Delete ${member.name}`}
                        onClick={() => deleteMember(member)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && members.length === 0 && (
                <tr>
                  <td colSpan="5" className="members-empty">
                    <Users size={29} />
                    <strong>No members found</strong>
                    <span>
                      {search
                        ? 'Try a different name, email or phone number.'
                        : 'Register your first member to get started.'}
                    </span>
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="5" className="members-empty">
                    Loading members...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="members-pagination">
          <span>
            Showing <strong>{firstRecord}–{lastRecord}</strong> of{' '}
            <strong>{total}</strong> members
          </span>

          <div className="members-pagination-actions">
            <button
              className="members-page-button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>

            <span>Page {page} of {Math.max(1, totalPages)}</span>

            <button
              className="members-page-button"
              disabled={page >= totalPages || loading || totalPages === 0}
              onClick={() => setPage((current) => current + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="members-modal-backdrop" onMouseDown={closeModal}>
          <section
            className="members-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="members-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="members-modal-heading">
              <div>
                <h2 id="members-modal-title">
                  {editingMember ? 'Edit member' : 'Register a member'}
                </h2>
                <p>
                  {editingMember
                    ? 'Update the member contact details.'
                    : 'Enter the details of the new library member.'}
                </p>
              </div>

              <button
                className="members-action-button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close dialog"
              >
                <X size={19} />
              </button>
            </div>

            <form className="members-form" onSubmit={saveMember}>
              <label>
                Full name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  maxLength={120}
                  autoComplete="name"
                  placeholder="Enter full name"
                />
              </label>

              <label>
                Email address *
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                  required
                  maxLength={254}
                  autoComplete="email"
                  placeholder="name@example.com"
                />
              </label>

              <label>
                Phone number
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleFormChange}
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="Enter contact number (optional)"
                />
                <span className="members-field-help">
                  Phone number is optional.
                </span>
              </label>

              {error && (
                <div className="members-alert members-alert-error" role="alert">
                  {error}
                </div>
              )}

              <div className="members-form-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="button button-primary"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingMember
                      ? 'Save changes'
                      : 'Register member'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
