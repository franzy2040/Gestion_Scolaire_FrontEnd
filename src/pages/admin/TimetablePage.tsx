import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar, Clock, Plus, X, Edit2, Trash2, Search, Filter,
  ChevronLeft, ChevronRight, Users, BookOpen, MapPin, AlertCircle,
  CheckCircle, Download, Printer, Grid3X3, List
} from "lucide-react";
import { apiService } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

// ==================== TYPES ====================
interface TimetableSlot {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_id: number;
  subject_name?: string;
  teacher_id: number;
  teacher_name?: string;
  class_id: number;
  class_name?: string;
  classroom_id?: number;
  classroom_name?: string;
  notes?: string;
}

interface Subject {
  id: number;
  name: string;
  code?: string;
  section: "FR" | "EN";
  coefficient: number;
}

interface Classroom {
  id: number;
  name: string;
  capacity?: number;
  building?: string;
}

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
}

interface ClassOption {
  id: number;
  name: string;
  level_id: number;
}

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const TIME_SLOTS = [
  "07:30", "08:30", "09:30", "10:30", "11:30", "12:30",
  "13:30", "14:30", "15:30", "16:30", "17:30"
];

const SUBJECT_COLORS: Record<string, string> = {
  "Mathématiques": "bg-blue-100 text-blue-800 border-blue-200",
  "Physique": "bg-purple-100 text-purple-800 border-purple-200",
  "Chimie": "bg-green-100 text-green-800 border-green-200",
  "Biologie": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Français": "bg-red-100 text-red-800 border-red-200",
  "Anglais": "bg-amber-100 text-amber-800 border-amber-200",
  "Histoire": "bg-orange-100 text-orange-800 border-orange-200",
  "Géographie": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Philosophie": "bg-pink-100 text-pink-800 border-pink-200",
  "EPS": "bg-lime-100 text-lime-800 border-lime-200",
  "Informatique": "bg-indigo-100 text-indigo-800 border-indigo-200",
};

export default function TimetablePage() {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"timetable" | "subjects" | "classrooms" | "assignments">("timetable");
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");

  // Modals
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, subjectsRes, classroomsRes, teachersRes, classesRes] = await Promise.all([
        apiService.getAll({
          class_id: selectedClass || undefined,
          teacher_id: selectedTeacher || undefined,
          day_of_week: selectedDay || undefined,
        }),
        apiService.getSubjects(),
        apiService.getClassrooms(),
        apiService.getTeachers(),
        apiService.getClasses(),
      ]);
      setSlots(slotsRes || []);
      setSubjects(subjectsRes || []);
      setClassrooms(classroomsRes || []);
      setTeachers(teachersRes || []);
      setClasses(classesRes || []);
    } catch (err) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedTeacher, selectedDay]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteSlot = async (id: number) => {
    if (!confirm("Supprimer ce créneau ?")) return;
    try {
      await apiService.deleteTimetableSlot(id);
      toast.success("Créneau supprimé");
      loadData();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getSubjectColor = (subjectName: string) => {
    return SUBJECT_COLORS[subjectName] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Organiser les slots par jour et heure
  const getSlotsForDayAndTime = (dayIndex: number, timeSlot: string) => {
    return slots.filter((s) => {
      const slotHour = parseInt(s.start_time.split(":")[0]);
      const filterHour = parseInt(timeSlot.split(":")[0]);
      return s.day_of_week === dayIndex + 1 && slotHour === filterHour;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-[#1e3a8a]" />
              Emploi du Temps
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestion des créneaux, matières et affectations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "grid" ? "bg-white text-[#1e3a8a] shadow-sm" : "text-gray-500"
                }`}
              >
                <Grid3X3 className="w-4 h-4 inline mr-1" />
                Grille
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "list" ? "bg-white text-[#1e3a8a] shadow-sm" : "text-gray-500"
                }`}
              >
                <List className="w-4 h-4 inline mr-1" />
                Liste
              </button>
            </div>
            <button
              onClick={() => { setEditingSlot(null); setShowSlotModal(true); }}
              className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#152a5e] flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouveau Créneau
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 border-b border-gray-200">
          {[
            { id: "timetable", label: "Emploi du Temps", icon: Calendar },
            { id: "subjects", label: "Matières", icon: BookOpen },
            { id: "classrooms", label: "Salles", icon: MapPin },
            { id: "assignments", label: "Affectations", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#1e3a8a] text-[#1e3a8a]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === "timetable" && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]"
                >
                  <option value="">Toutes les classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]"
                >
                  <option value="">Tous les enseignants</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>
                  ))}
                </select>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]"
                >
                  <option value="">Tous les jours</option>
                  {DAYS.map((day, i) => (
                    <option key={i} value={i + 1}>{day}</option>
                  ))}
                </select>
                <button
                  onClick={() => { setSelectedClass(""); setSelectedTeacher(""); setSelectedDay(""); }}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            {viewMode === "grid" ? (
              /* GRID VIEW */
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 bg-gray-50 border-b border-r border-gray-200 text-xs font-semibold text-gray-600 w-20">
                          Heure
                        </th>
                        {DAYS.map((day) => (
                          <th key={day} className="px-3 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 min-w-[180px]">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TIME_SLOTS.map((timeSlot, timeIdx) => (
                        <tr key={timeSlot} className="border-b border-gray-100">
                          <td className="px-3 py-2 bg-gray-50 border-r border-gray-200 text-xs font-medium text-gray-600 text-center">
                            {timeSlot}
                          </td>
                          {DAYS.map((_, dayIdx) => {
                            const daySlots = getSlotsForDayAndTime(dayIdx, timeSlot);
                            return (
                              <td key={dayIdx} className="px-1 py-1 border-r border-gray-100 min-h-[80px] align-top">
                                <div className="space-y-1">
                                  {daySlots.map((slot) => (
                                    <div
                                      key={slot.id}
                                      className={`rounded-lg border p-2 text-xs cursor-pointer hover:shadow-md transition-shadow ${getSubjectColor(slot.subject_name || "")}`}
                                      onClick={() => { setEditingSlot(slot); setShowSlotModal(true); }}
                                    >
                                      <p className="font-semibold truncate">{slot.subject_name}</p>
                                      <p className="truncate opacity-80">{slot.teacher_name}</p>
                                      <p className="truncate opacity-70 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {slot.classroom_name || "Salle non définie"}
                                      </p>
                                      <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] opacity-60">
                                          {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                                        </span>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                                          className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {daySlots.length === 0 && (
                                    <div className="h-16 flex items-center justify-center">
                                      <button
                                        onClick={() => {
                                          setEditingSlot({
                                            id: 0,
                                            day_of_week: dayIdx + 1,
                                            start_time: timeSlot,
                                            end_time: `${parseInt(timeSlot.split(":")[0]) + 1}:00`,
                                            subject_id: 0,
                                            teacher_id: 0,
                                            class_id: selectedClass ? parseInt(selectedClass) : 0,
                                          } as TimetableSlot);
                                          setShowSlotModal(true);
                                        }}
                                        className="w-full h-full flex items-center justify-center text-gray-300 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* LIST VIEW */
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jour</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Horaire</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matière</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Enseignant</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Classe</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Salle</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Chargement...</td></tr>
                    ) : slots.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Aucun créneau</td></tr>
                    ) : (
                      slots.map((slot) => (
                        <tr key={slot.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {DAYS[slot.day_of_week - 1]}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <Clock className="w-3.5 h-3.5 inline mr-1" />
                            {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSubjectColor(slot.subject_name || "")}`}>
                              {slot.subject_name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{slot.teacher_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{slot.class_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{slot.classroom_name || "-"}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setEditingSlot(slot); setShowSlotModal(true); }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === "subjects" && (
          <SubjectsTab
            subjects={subjects}
            onRefresh={loadData}
            onCreate={() => setShowSubjectModal(true)}
          />
        )}

        {activeTab === "classrooms" && (
          <ClassroomsTab
            classrooms={classrooms}
            onRefresh={loadData}
            onCreate={() => setShowClassroomModal(true)}
          />
        )}

        {activeTab === "assignments" && (
          <AssignmentsTab
            classes={classes}
            teachers={teachers}
            subjects={subjects}
            onRefresh={loadData}
          />
        )}
      </div>

      {/* Modals */}
      {showSlotModal && (
        <SlotModal
          slot={editingSlot}
          subjects={subjects}
          teachers={teachers}
          classes={classes}
          classrooms={classrooms}
          onClose={() => { setShowSlotModal(false); setEditingSlot(null); }}
          onSuccess={() => { loadData(); setShowSlotModal(false); setEditingSlot(null); }}
        />
      )}
      {showSubjectModal && (
        <SubjectModal
          onClose={() => setShowSubjectModal(false)}
          onSuccess={() => { loadData(); setShowSubjectModal(false); }}
        />
      )}
      {showClassroomModal && (
        <ClassroomModal
          onClose={() => setShowClassroomModal(false)}
          onSuccess={() => { loadData(); setShowClassroomModal(false); }}
        />
      )}
    </div>
  );
}

// ==================== SLOT MODAL ====================
function SlotModal({
  slot,
  subjects,
  teachers,
  classes,
  classrooms,
  onClose,
  onSuccess,
}: {
  slot: TimetableSlot | null;
  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassOption[];
  classrooms: Classroom[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    day_of_week: slot?.day_of_week || 1,
    start_time: slot?.start_time?.slice(0, 5) || "07:30",
    end_time: slot?.end_time?.slice(0, 5) || "08:30",
    subject_id: slot?.subject_id?.toString() || "",
    teacher_id: slot?.teacher_id?.toString() || "",
    class_id: slot?.class_id?.toString() || "",
    classroom_id: slot?.classroom_id?.toString() || "",
    notes: slot?.notes || "",
    academic_year_id: 1,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        day_of_week: parseInt(formData.day_of_week.toString()),
        subject_id: parseInt(formData.subject_id),
        teacher_id: parseInt(formData.teacher_id),
        class_id: parseInt(formData.class_id),
        classroom_id: formData.classroom_id ? parseInt(formData.classroom_id) : null,
        academic_year_id: 1,
      };

      if (slot?.id) {
        await apiService.updateTimetableSlot(slot.id, payload);
        toast.success("Créneau mis à jour");
      } else {
        await apiService.createTimetableSlot(payload);
        toast.success("Créneau créé");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {slot?.id ? "Modifier le Créneau" : "Nouveau Créneau"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jour *</label>
              <select
                required
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]"
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i + 1}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classe *</label>
              <select
                required
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]"
              >
                <option value="">Sélectionner...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Début *</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin *</label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
              <select
                required
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]"
              >
                <option value="">Sélectionner...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enseignant *</label>
              <select
                required
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]"
              >
                <option value="">Sélectionner...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || `${t.first_name} ${t.last_name}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
            <select
              value={formData.classroom_id}
              onChange={(e) => setFormData({ ...formData, classroom_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]"
            >
              <option value="">Non définie</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]"
              placeholder="Remarques..."
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm font-medium hover:bg-[#152a5e] disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {slot?.id ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== SUBJECTS TAB ====================
function SubjectsTab({ subjects, onRefresh, onCreate }: { subjects: Subject[]; onRefresh: () => void; onCreate: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Liste des Matières</h2>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#152a5e] flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Matière
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nom</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Section</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Coefficient</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subjects.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Aucune matière</td></tr>
            ) : (
              subjects.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{s.code || "-"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.section === "FR" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {s.section}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{s.coefficient}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== CLASSROOMS TAB ====================
function ClassroomsTab({ classrooms, onRefresh, onCreate }: { classrooms: Classroom[]; onRefresh: () => void; onCreate: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Liste des Salles</h2>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#152a5e] flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Salle
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classrooms.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{c.building || "Bâtiment principal"}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#1e3a8a]" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {c.capacity || "-"} places
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== ASSIGNMENTS TAB ====================
function AssignmentsTab({
  classes,
  teachers,
  subjects,
  onRefresh,
}: {
  classes: ClassOption[];
  teachers: Teacher[];
  subjects: Subject[];
  onRefresh: () => void;
}) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    apiService.getTeacherAssignments().then((res) => setAssignments(res || []));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Affectations Enseignants</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#152a5e] flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Affectation
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Enseignant</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matière</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Classe</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Heures</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Principal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignments.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Aucune affectation</td></tr>
            ) : (
              assignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.teacher_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{a.subject_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{a.class_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{a.hours_assigned || "-"}h</td>
                  <td className="px-4 py-3">
                    {a.is_principal_teacher ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AssignmentModal
          classes={classes}
          teachers={teachers}
          subjects={subjects}
          onClose={() => setShowModal(false)}
          onSuccess={() => { onRefresh(); setShowModal(false); }}
        />
      )}
    </div>
  );
}

// ==================== SUBJECT MODAL ====================
function SubjectModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: "", code: "", section: "FR", coefficient: 1, level_id: 1 });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.createSubject(formData);
      toast.success("Matière créée");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Nouvelle Matière</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coefficient</label>
              <input type="number" step="0.5" min="0.5" value={formData.coefficient} onChange={(e) => setFormData({ ...formData, coefficient: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="FR">Francophone</option>
              <option value="EN">Anglophone</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm disabled:opacity-50">Créer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== CLASSROOM MODAL ====================
function ClassroomModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: "", capacity: "", building: "", floor: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.createClassroom({
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      });
      toast.success("Salle créée");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Nouvelle Salle</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacité</label>
              <input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Étage</label>
              <input value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bâtiment</label>
            <input value={formData.building} onChange={(e) => setFormData({ ...formData, building: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm disabled:opacity-50">Créer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== ASSIGNMENT MODAL ====================
function AssignmentModal({
  classes,
  teachers,
  subjects,
  onClose,
  onSuccess,
}: {
  classes: ClassOption[];
  teachers: Teacher[];
  subjects: Subject[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({ teacher_id: "", subject_id: "", class_id: "", hours_assigned: "", is_principal: false });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.createTeacherAssignment({
        teacher_id: parseInt(formData.teacher_id),
        subject_id: parseInt(formData.subject_id),
        class_id: parseInt(formData.class_id),
        hours_assigned: formData.hours_assigned ? parseFloat(formData.hours_assigned) : undefined,
        is_principal_teacher: formData.is_principal,
        academic_year_id: 1,
      });
      toast.success("Affectation créée");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Nouvelle Affectation</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enseignant *</label>
            <select required value={formData.teacher_id} onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Sélectionner...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
            <select required value={formData.subject_id} onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Sélectionner...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Classe *</label>
            <select required value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Sélectionner...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heures/semaine</label>
              <input type="number" value={formData.hours_assigned} onChange={(e) => setFormData({ ...formData, hours_assigned: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formData.is_principal} onChange={(e) => setFormData({ ...formData, is_principal: e.target.checked })} className="w-4 h-4 rounded" />
            Enseignant principal de la classe
          </label>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm disabled:opacity-50">Créer</button>
          </div>
        </form>
      </div>
    </div>
  );
}