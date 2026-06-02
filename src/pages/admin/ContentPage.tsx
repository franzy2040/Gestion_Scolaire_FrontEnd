import { useState, useEffect, useCallback } from 'react'
import {
  Newspaper, Plus, Search, Filter, Edit2, Trash2, Eye, Calendar,
  Image, MessageSquare, Send, CheckCircle, XCircle, Clock, User,
  ThumbsUp, MessageCircle, Share2, ExternalLink, Upload, X,
  ChevronLeft, ChevronRight, TrendingUp, Users, FileText
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { contentApi } from '@/services/api'
import { toast } from 'sonner'

// ==================== TYPES ====================
interface NewsItem {
  id: number
  title: string
  content: string
  excerpt: string
  category: string
  image_url?: string
  author_id: number
  author_name: string
  is_published: boolean
  published_at?: string
  created_at: string
  views: number
  likes: number
}

interface EventItem {
  id: number
  title: string
  description: string
  event_date: string
  event_time: string
  location: string
  image_url?: string
  category: string
  is_public: boolean
  attendees_count: number
  created_at: string
}

interface GalleryImage {
  id: number
  title: string
  description: string
  image_url: string
  category: string
  uploaded_by: string
  created_at: string
}

interface ForumTopic {
  id: number
  title: string
  content: string
  author_id: number
  author_name: string
  category: string
  replies_count: number
  views: number
  is_pinned: boolean
  is_locked: boolean
  created_at: string
  last_reply_at?: string
}

const NEWS_CATEGORIES = ['Général', 'Académique', 'Sport', 'Culture', 'Administration', 'Urgence']
const EVENT_CATEGORIES = ['Cérémonie', 'Sport', 'Culture', 'Réunion', 'Formation', 'Autre']
const GALLERY_CATEGORIES = ['Événements', 'Classes', 'Sports', 'Vie scolaire', 'Infrastructure']
const FORUM_CATEGORIES = ['Général', 'Académique', 'Orientation', 'Vie scolaire', 'Administration']

export default function ContentPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'news' | 'events' | 'gallery' | 'forum'>('news')
  const [loading, setLoading] = useState(true)

  // News
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsPage, setNewsPage] = useState(1)
  const [newsTotal, setNewsTotal] = useState(0)

  // Events
  const [events, setEvents] = useState<EventItem[]>([])
  const [eventsPage, setEventsPage] = useState(1)
  const [eventsTotal, setEventsTotal] = useState(0)

  // Gallery
  const [images, setImages] = useState<GalleryImage[]>([])
  const [galleryPage, setGalleryPage] = useState(1)
  const [galleryTotal, setGalleryTotal] = useState(0)

  // Forum
  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [forumPage, setForumPage] = useState(1)
  const [forumTotal, setForumTotal] = useState(0)

  // Modals
  const [showNewsForm, setShowNewsForm] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showTopicForm, setShowTopicForm] = useState(false)
  const [showTopicDetail, setShowTopicDetail] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  const perPage = 12

  const loadNews = useCallback(async () => {
    try {
      const response = await contentApi.getNews({ page: newsPage, per_page: perPage })
      setNews(response.items || [])
      setNewsTotal(response.total || 0)
    } catch (err) {
      console.error('Error loading news:', err)
    }
  }, [newsPage])

  const loadEvents = useCallback(async () => {
    try {
      const response = await contentApi.getEvents({ page: eventsPage, per_page: perPage })
      setEvents(response.items || [])
      setEventsTotal(response.total || 0)
    } catch (err) {
      console.error('Error loading events:', err)
    }
  }, [eventsPage])

  const loadGallery = useCallback(async () => {
    try {
      const response = await contentApi.getGallery({ page: galleryPage, per_page: perPage })
      setImages(response.items || [])
      setGalleryTotal(response.total || 0)
    } catch (err) {
      console.error('Error loading gallery:', err)
    }
  }, [galleryPage])

  const loadForum = useCallback(async () => {
    try {
      const response = await contentApi.getForumTopics({ page: forumPage, per_page: perPage })
      setTopics(response.items || [])
      setForumTotal(response.total || 0)
    } catch (err) {
      console.error('Error loading forum:', err)
    }
  }, [forumPage])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadNews(), loadEvents(), loadGallery(), loadForum()])
      .finally(() => setLoading(false))
  }, [loadNews, loadEvents, loadGallery, loadForum])

  const handleDeleteNews = async (id: number) => {
    if (!confirm('Supprimer cette actualité ?')) return
    try {
      await contentApi.deleteNews(id)
      toast.success('Actualité supprimée')
      loadNews()
    } catch (err) {
      toast.error('Erreur')
    }
  }

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Supprimer cet événement ?')) return
    try {
      await contentApi.deleteEvent(id)
      toast.success('Événement supprimé')
      loadEvents()
    } catch (err) {
      toast.error('Erreur')
    }
  }

  const handleDeleteImage = async (id: number) => {
    if (!confirm('Supprimer cette image ?')) return
    try {
      await contentApi.deleteImage(id)
      toast.success('Image supprimée')
      loadGallery()
    } catch (err) {
      toast.error('Erreur')
    }
  }

  const handlePublishToggle = async (item: NewsItem) => {
    try {
      await contentApi.updateNews(item.id, { is_published: !item.is_published })
      toast.success(item.is_published ? 'Dépublié' : 'Publié')
      loadNews()
    } catch (err) {
      toast.error('Erreur')
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Urgence': 'bg-red-100 text-red-700',
      'Académique': 'bg-blue-100 text-blue-700',
      'Sport': 'bg-green-100 text-green-700',
      'Culture': 'bg-purple-100 text-purple-700',
      'Administration': 'bg-gray-100 text-gray-700',
      'Général': 'bg-blue-100 text-blue-700',
    }
    return colors[category] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <Newspaper className="h-7 w-7 text-primary-600" />
              Gestion du Contenu
            </h1>
            <p className="page-subtitle">
              Actualités, événements, galerie et forum
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 border-b border-gray-200">
          {[
            { id: 'news', label: 'Actualités', icon: Newspaper },
            { id: 'events', label: 'Événements', icon: Calendar },
            { id: 'gallery', label: 'Galerie', icon: Image },
            { id: 'forum', label: 'Forum', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* NEWS TAB */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Actualités</h2>
            <button
              onClick={() => { setEditingNews(null); setShowNewsForm(true) }}
              className="btn-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle actualité
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <div key={item.id} className="card overflow-hidden group">
                {item.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                    {!item.is_published && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        Brouillon
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-3 mb-3">{item.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {item.author_name}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {item.likes}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handlePublishToggle(item)}
                      className={`p-1.5 rounded-lg ${item.is_published ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                      title={item.is_published ? 'Dépublier' : 'Publier'}
                    >
                      {item.is_published ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { setEditingNews(item); setShowNewsForm(true) }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNews(item.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {newsTotal > perPage && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setNewsPage(Math.max(1, newsPage - 1))}
                disabled={newsPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">Page {newsPage}</span>
              <button
                onClick={() => setNewsPage(newsPage + 1)}
                disabled={newsPage * perPage >= newsTotal}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* EVENTS TAB */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Événements</h2>
            <button
              onClick={() => { setEditingEvent(null); setShowEventForm(true) }}
              className="btn-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvel événement
            </button>
          </div>

          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="card">
                <div className="card-body flex gap-4">
                  {event.image_url && (
                    <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                            {event.category}
                          </span>
                          {event.is_public && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Public
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900">{event.title}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingEvent(event); setShowEventForm(true) }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.event_date).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.event_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {event.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.attendees_count} participants
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GALLERY TAB */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Galerie photos</h2>
            <button
              onClick={() => setShowImageUpload(true)}
              className="btn-primary"
            >
              <Upload className="mr-2 h-4 w-4" />
              Ajouter photos
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium">{image.title}</p>
                  <p className="text-white/80 text-xs">{image.category}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteImage(image.id) }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORUM TAB */}
      {activeTab === 'forum' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Forum de discussion</h2>
            <button
              onClick={() => setShowTopicForm(true)}
              className="btn-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau sujet
            </button>
          </div>

          <div className="space-y-3">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className={`card cursor-pointer hover:shadow-md transition-shadow ${topic.is_pinned ? 'border-l-4 border-l-primary-500' : ''}`}
                onClick={() => { setSelectedTopic(topic); setShowTopicDetail(true) }}
              >
                <div className="card-body py-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {topic.is_pinned && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                            Épinglé
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(topic.category)}`}>
                          {topic.category}
                        </span>
                        {topic.is_locked && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Verrouillé
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900">{topic.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{topic.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {topic.author_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {topic.replies_count} réponses
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {topic.views} vues
                        </span>
                        <span>
                          {new Date(topic.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News Form Modal */}
      {showNewsForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewsForm(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full animate-bounce-in max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingNews ? 'Modifier l\'actualité' : 'Nouvelle actualité'}
              </h3>
              <button onClick={() => setShowNewsForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <NewsForm
              initialData={editingNews || undefined}
              onSubmit={async (data) => {
                try {
                  if (editingNews) {
                    await contentApi.updateNews(editingNews.id, data)
                  } else {
                    await contentApi.createNews(data)
                  }
                  toast.success(editingNews ? 'Actualité mise à jour' : 'Actualité créée')
                  setShowNewsForm(false)
                  loadNews()
                } catch (err) {
                  toast.error('Erreur')
                }
              }}
              onCancel={() => setShowNewsForm(false)}
            />
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.image_url}
              alt={selectedImage.title}
              className="max-w-full max-h-[85vh] rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg">
              <p className="text-white font-medium">{selectedImage.title}</p>
              <p className="text-white/80 text-sm">{selectedImage.description}</p>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Topic Detail Modal */}
      {showTopicDetail && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTopicDetail(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full animate-bounce-in max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold">{selectedTopic.title}</h3>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                {selectedTopic.author_name}
                <span>•</span>
                {new Date(selectedTopic.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700">{selectedTopic.content}</p>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-medium mb-4">Réponses ({selectedTopic.replies_count})</h4>
                {/* Les réponses seraient chargées ici */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium">Utilisateur</p>
                      <p className="text-sm text-gray-600 mt-1">Contenu de la réponse...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// ==================== SUB-COMPONENTS ====================

function NewsForm({ initialData, onSubmit, onCancel }: {
  initialData?: NewsItem
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    excerpt: initialData?.excerpt || '',
    category: initialData?.category || 'Général',
    is_published: initialData?.is_published ?? false,
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(formData)
      }}
      className="p-6 space-y-4"
    >
      <div>
        <label className="label">Titre *</label>
        <input
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="input"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Catégorie</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="input"
          >
            {NEWS_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Statut</label>
          <select
            value={formData.is_published ? 'published' : 'draft'}
            onChange={(e) => setFormData({ ...formData, is_published: e.target.value === 'published' })}
            className="input"
          >
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Résumé</label>
        <input
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          className="input"
          placeholder="Résumé court pour les listes..."
        />
      </div>
      <div>
        <label className="label">Contenu *</label>
        <textarea
          required
          rows={6}
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="input"
          placeholder="Contenu complet de l'actualité..."
        />
      </div>
      <div>
        <label className="label">Image</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Glissez une image ou cliquez pour parcourir</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-outline">
          Annuler
        </button>
        <button type="submit" className="btn-primary">
          {initialData ? 'Mettre à jour' : 'Publier'}
        </button>
      </div>
    </form>
  )
}