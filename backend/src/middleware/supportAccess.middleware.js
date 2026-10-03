/**
 * Support Access & Authorization Middleware
 * Enforces role hierarchy, escalation ladder, and multi-tenant scoping for tickets.
 */

export const normalizeRole = (role = "") => {
  const r = String(role).toLowerCase().trim();
  if (r === "superadmin" || r === "super_admin") return "super_admin";
  if (r === "instituteadmin" || r === "institute_admin") return "institute_admin";
  if (
    r === "campusadmin" ||
    r === "campus_admin" ||
    r === "campus_manager" ||
    r === "principal" ||
    r === "accountant"
  )
    return "campus_admin";
  if (r === "teacher" || r === "faculty") return "teacher";
  if (r === "student") return "student";
  if (r === "parent") return "parent";
  return r;
};

export const isAdminRole = (role) => {
  const r = normalizeRole(role);
  return r === "super_admin" || r === "institute_admin" || r === "campus_admin";
};

/**
 * 1. Can View Ticket
 */
export const canViewTicket = (user, ticket) => {
  if (!user || !ticket) return false;
  const role = normalizeRole(user.role);

  // Super admin sees all tickets
  if (role === "super_admin") return true;

  // Institute admin sees all tickets within their institute
  if (role === "institute_admin") {
    if (!ticket.instituteId || !user.instituteId) return true;
    return String(ticket.instituteId) === String(user.instituteId);
  }

  // Campus admin sees all tickets within their campus
  if (role === "campus_admin") {
    if (!ticket.campusId || !user.campusId) return true;
    return String(ticket.campusId) === String(user.campusId);
  }

  // Teachers see tickets they created OR assigned to them OR campus Academic tickets
  if (role === "teacher") {
    const isCreator = String(ticket.createdBy?._id || ticket.createdBy) === String(user._id);
    const isAssignee = ticket.assignedTo && String(ticket.assignedTo?._id || ticket.assignedTo) === String(user._id);
    const isCampusAcademic = Boolean(
      user.campusId &&
      ticket.campusId &&
      String(ticket.campusId) === String(user.campusId) &&
      ticket.category === "Academic"
    );
    return isCreator || isAssignee || isCampusAcademic;
  }

  // Students and parents see only tickets they created
  if (role === "student" || role === "parent") {
    return String(ticket.createdBy?._id || ticket.createdBy) === String(user._id);
  }

  return false;
};

/**
 * 2. Can Reply To Ticket
 */
export const canReplyToTicket = (user, ticket) => {
  if (!user || !ticket) return false;
  if (ticket.status === "Closed" || ticket.status === "Cancelled") return false;
  return canViewTicket(user, ticket);
};

/**
 * 3. Can Assign Ticket (Admin only)
 */
export const canAssignTicket = (user, ticket) => {
  if (!user || !ticket) return false;
  const role = normalizeRole(user.role);
  if (!isAdminRole(role)) return false;

  if (role === "super_admin") return true;
  if (role === "institute_admin") {
    return (
      !ticket.instituteId ||
      !user.instituteId ||
      String(ticket.instituteId) === String(user.instituteId)
    );
  }
  if (role === "campus_admin") {
    return (
      !ticket.campusId ||
      !user.campusId ||
      String(ticket.campusId) === String(user.campusId)
    );
  }
  return false;
};

/**
 * 4. Can Escalate Ticket (Admin only, Level 1 -> 2 -> 3)
 */
export const canEscalateTicket = (user, ticket) => {
  if (!user || !ticket) return false;
  const role = normalizeRole(user.role);
  if (!isAdminRole(role)) return false;
  if (ticket.status === "Closed" || ticket.status === "Cancelled") return false;
  if ((ticket.escalationLevel || 1) >= 3) return false;

  return canAssignTicket(user, ticket);
};

/**
 * 5. Can Close Ticket (Creator or Admin)
 */
export const canCloseTicket = (user, ticket) => {
  if (!user || !ticket) return false;
  if (ticket.status === "Closed" || ticket.status === "Cancelled") return false;

  const isCreator = String(ticket.createdBy?._id || ticket.createdBy) === String(user._id);
  if (isCreator) return true;

  return canAssignTicket(user, ticket);
};

/**
 * 6. Can Message User (Role Matrix Validation)
 * Permission matrix:
 * - Super Admin -> everyone
 * - Institute Admin -> Super Admin, everyone in their institute
 * - Campus Admin -> Institute Admin, Super Admin, everyone in their campus
 * - Teacher -> Campus Admin, other teachers (peer), own students, own students' parents
 * - Student -> Campus Admin, own teachers
 * - Parent -> Campus Admin, own child's teachers
 */
export const canMessageUser = (sender, recipient) => {
  if (!sender || !recipient) return false;
  const sRole = normalizeRole(sender.role);
  const rRole = normalizeRole(recipient.role);

  if (sRole === "super_admin") return true;

  if (sRole === "institute_admin") {
    if (rRole === "super_admin") return true;
    if (sender.instituteId && recipient.instituteId) {
      return String(sender.instituteId) === String(recipient.instituteId);
    }
    return true;
  }

  if (sRole === "campus_admin") {
    if (rRole === "super_admin" || rRole === "institute_admin") return true;
    if (sender.campusId && recipient.campusId) {
      return String(sender.campusId) === String(recipient.campusId);
    }
    return true;
  }

  if (sRole === "teacher") {
    if (rRole === "campus_admin" || rRole === "teacher") return true;
    if (rRole === "student" || rRole === "parent") {
      if (sender.campusId && recipient.campusId) {
        return String(sender.campusId) === String(recipient.campusId);
      }
      return true;
    }
    return false;
  }

  if (sRole === "student") {
    if (rRole === "campus_admin") return true;
    if (rRole === "teacher") {
      if (sender.campusId && recipient.campusId) {
        return String(sender.campusId) === String(recipient.campusId);
      }
      return true;
    }
    return false;
  }

  if (sRole === "parent") {
    if (rRole === "campus_admin") return true;
    if (rRole === "teacher") {
      if (sender.campusId && recipient.campusId) {
        return String(sender.campusId) === String(recipient.campusId);
      }
      return true;
    }
    return false;
  }

  return false;
};

export default {
  normalizeRole,
  isAdminRole,
  canViewTicket,
  canReplyToTicket,
  canAssignTicket,
  canEscalateTicket,
  canCloseTicket,
  canMessageUser,
};
