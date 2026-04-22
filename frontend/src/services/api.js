const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = sessionStorage.getItem('token');
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  async handleResponse(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data?.message || res.statusText || 'Unknown error';
      throw new Error(message);
    }
    return data;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      sessionStorage.setItem('token', token);
    } else {
      sessionStorage.removeItem('token');
    }
  }

  // Auth endpoints
  register(data) {
    return fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json());
  }

  login(email, password) {
    return fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(res => res.json());
  }

  loginTeam(email, password) {
    return fetch(`${this.baseURL}/auth/login-team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(res => res.json());
  }

  getCurrentUser() {
    return fetch(`${this.baseURL}/auth/me`, {
      headers: this.getHeaders()
    }).then(res => res.json());
  }

  // Compatibility
  getCurrentAdmin() {
    return this.getCurrentUser();
  }

  // Client endpoints
  getAllClients() {
    return fetch(`${this.baseURL}/clients`, {
      headers: this.getHeaders()
    }).then(res => res.json());
  }

  getClientById(id) {
    return fetch(`${this.baseURL}/clients/${id}`, {
      headers: this.getHeaders()
    }).then(res => res.json());
  }

  addClient(data) {
    const formData = new FormData();
    if (data instanceof FormData) {
      return fetch(`${this.baseURL}/clients`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` },
        body: data
      }).then((res) => this.handleResponse(res));
    } else {
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      return fetch(`${this.baseURL}/clients`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` },
        body: formData
      }).then((res) => this.handleResponse(res));
    }
  }

  updateClient(id, data) {
    const formData = new FormData();
    if (data instanceof FormData) {
      return fetch(`${this.baseURL}/clients/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.token}` },
        body: data
      }).then(res => res.json());
    } else {
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      return fetch(`${this.baseURL}/clients/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.token}` },
        body: formData
      }).then(res => res.json());
    }
  }

  deleteClient(id) {
    return fetch(`${this.baseURL}/clients/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    }).then(res => res.json());
  }

  getClientStats() {
    return fetch(`${this.baseURL}/clients/stats`, {
      headers: this.getHeaders()
    }).then(res => res.json());
  }

  // Team endpoints
  getAllTeam() {
    return fetch(`${this.baseURL}/team`, {
      headers: this.getHeaders()
    }).then(res => this.handleResponse(res));
  }

  getTeamMemberById(id) {
    return fetch(`${this.baseURL}/team/${id}`, {
      headers: this.getHeaders()
    }).then(res => this.handleResponse(res));
  }

  addTeamMember(data) {
    return fetch(`${this.baseURL}/team`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    }).then(res => this.handleResponse(res));
  }

  updateTeamMember(id, data) {
    return fetch(`${this.baseURL}/team/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    }).then(res => this.handleResponse(res));
  }

  deleteTeamMember(id) {
    return fetch(`${this.baseURL}/team/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    }).then(res => this.handleResponse(res));
  }

  getTeamStats() {
    return fetch(`${this.baseURL}/team/stats`, {
      headers: this.getHeaders()
    }).then(res => this.handleResponse(res));
  }

  // Package endpoints
  getAllPackages() {
    return fetch(`${this.baseURL}/packages`, {
      headers: this.getHeaders()
    }).then(res => res.json());
  }

  getPackageById(id) {
    return fetch(`${this.baseURL}/packages/${id}`, {
      headers: this.getHeaders()
    }).then(res => res.json());
  }

  createPackage(data) {
    return fetch(`${this.baseURL}/packages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    }).then((res) => this.handleResponse(res));
  }

  updatePackage(id, data) {
    return fetch(`${this.baseURL}/packages/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    }).then((res) => this.handleResponse(res));
  }

  deletePackage(id) {
    return fetch(`${this.baseURL}/packages/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    }).then((res) => this.handleResponse(res));
  }

  getPackageStats() {
    return fetch(`${this.baseURL}/packages/stats`, {
      headers: this.getHeaders()
    }).then((res) => this.handleResponse(res));
  }

  // Assignment endpoints
  getAllAssignments() {
    return fetch(`${this.baseURL}/assignments`, {
      headers: this.getHeaders()
    }).then((res) => this.handleResponse(res));
  }

  getActiveAssignmentByClient(clientId) {
    return fetch(`${this.baseURL}/assignments/client/${clientId}/active`, {
      headers: this.getHeaders()
    }).then((res) => this.handleResponse(res));
  }

  createAssignment(data) {
    return fetch(`${this.baseURL}/assignments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    }).then((res) => this.handleResponse(res));
  }

  updateAssignmentDelivery(id, data) {
    return fetch(`${this.baseURL}/assignments/${id}/delivery`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    }).then((res) => this.handleResponse(res));
  }

  getTaskHistory() {
    return fetch(`${this.baseURL}/tasks/history`, {
      headers: this.getHeaders()
    }).then(res => res.json());
  }

  getClientReport(clientId) {
    return fetch(`${this.baseURL}/tasks/client-report/${clientId}`, {
      headers: this.getHeaders()
    }).then(res => res.json());
  }

  getAllTasks() {
    return fetch(`${this.baseURL}/tasks`, {
      headers: this.getHeaders()
    }).then(res => res.json());
  }

  getTaskById(id) {
    return fetch(`${this.baseURL}/tasks/${id}`, {
      headers: this.getHeaders()
    }).then(res => res.json());
  }

  createTask(data) {
    if (data instanceof FormData) {
      return fetch(`${this.baseURL}/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` },
        body: data
      }).then((res) => this.handleResponse(res));
    } else {
      return fetch(`${this.baseURL}/tasks`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      }).then((res) => this.handleResponse(res));
    }
  }

  updateTask(id, data) {
    if (data instanceof FormData) {
      return fetch(`${this.baseURL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.token}` },
        body: data
      }).then((res) => this.handleResponse(res));
    } else {
      return fetch(`${this.baseURL}/tasks/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      }).then((res) => this.handleResponse(res));
    }
  }

  updateTaskStatus(id, status) {
    return fetch(`${this.baseURL}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    }).then(res => res.json());
  }

  deleteTask(id) {
    return fetch(`${this.baseURL}/tasks/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    }).then((res) => this.handleResponse(res));
  }

  getTaskStats() {
    return fetch(`${this.baseURL}/tasks/stats`, {
      headers: this.getHeaders()
    }).then((res) => this.handleResponse(res));
  }

  // Notification endpoints
  getAllNotifications() {
    return fetch(`${this.baseURL}/notifications`, {
      headers: this.getHeaders()
    }).then(res => res.json());
  }

  updateNotificationStatus(id, status) {
    return fetch(`${this.baseURL}/notifications/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    }).then(res => res.json());
  }

  sendManualNotification(taskId) {
    return fetch(`${this.baseURL}/notifications/manual`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ taskId })
    }).then((res) => this.handleResponse(res));
  }

  // Generic methods for compatibility
  get(url, options = {}) {
    return fetch(`${this.baseURL}${url}`, {
      ...options,
      headers: { ...this.getHeaders(), ...options.headers }
    }).then(res => this.handleResponse(res));
  }

  post(url, data, options = {}) {
    return fetch(`${this.baseURL}${url}`, {
      ...options,
      method: 'POST',
      headers: { ...this.getHeaders(), ...options.headers },
      body: JSON.stringify(data)
    }).then(res => this.handleResponse(res));
  }
}

const apiServiceInstance = new APIService();
export default apiServiceInstance;
