import type { Applicant } from '@/components/loan/ApplicantList';
import { transformToApplicant } from '../utils/transformData';
import type { ApplicationResponse } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type RequestHeaders = Record<string, string> & {
  'Content-Type'?: string;
  'Accept'?: string;
  'Authorization'?: string;
};

// Executes a typed API request with automatic token refresh and error handling
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: RequestHeaders = {};
  
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
    defaultHeaders['Accept'] = 'application/json';
  }

  const headers: RequestHeaders = {
    ...defaultHeaders,
    ...((options.headers as RequestHeaders) || {})
  };

  if (headers.Authorization) {
    const token = headers.Authorization;
    if (!token) {
      delete headers.Authorization;
    } else {
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      headers.Authorization = formattedToken;
    }
  }

  const executeRequest = async (shouldRefresh = true): Promise<T> => {
    const requestUrl = `${API_URL}${endpoint}`;
    const hasAuth = 'Authorization' in headers;

    try {
      const isDocumentRequest = endpoint.startsWith('/documents/');
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const url = isDocumentRequest 
        ? `${requestUrl}${requestUrl.includes('?') ? '&' : '?'}t=${timestamp}&noCache=${random}&v=${timestamp}`
        : requestUrl;

      if (isDocumentRequest) {
        headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
        headers['Surrogate-Control'] = 'no-store';
        headers['If-None-Match'] = `"${timestamp}-${random}"`;
        headers['If-Modified-Since'] = new Date(0).toUTCString();
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401 && shouldRefresh && headers.Authorization) {
          const storedUser = localStorage.getItem('authUser');
          if (!storedUser) {
            throw new Error('Authentication required');
          }

          const user = JSON.parse(storedUser);

          try {
            const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
              }
            });

            if (!refreshResponse.ok) {
              localStorage.removeItem('authUser');
              window.dispatchEvent(new Event('auth-error'));
              throw new Error('Session expired. Please log in again.');
            }

            const { access_token } = await refreshResponse.json();

            user.token = access_token;
            localStorage.setItem('authUser', JSON.stringify(user));

            headers.Authorization = `Bearer ${access_token}`;

            return executeRequest(false);
          } catch (error) {
            console.error('Token refresh failed:', error);
            throw error;
          }
        }

        const contentType = response.headers.get('content-type');
        let errorData;
        
        try {
          errorData = contentType?.includes('application/json') 
            ? await response.json()
            : { message: response.statusText };
        } catch {
          errorData = { message: response.statusText };
        }

        console.error('API Error: status=' + response.status + ' statusText=' + response.statusText);

        throw new Error(errorData.detail || errorData.message || 'API error');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Request failed: ' + (error instanceof Error ? error.message : (error ? String(error) : 'Unknown error')));
      throw error;
    }
  };

  return executeRequest();
}

// Authenticates user with OAuth2 password flow and returns access token
export async function login(username: string, password: string) {
  const body = new URLSearchParams({
    username: username,
    password: password,
    grant_type: 'password'
  });

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    let error;
    
    try {
      error = contentType?.includes('application/json') 
        ? await res.json()
        : { message: res.statusText };
    } catch {
      error = { message: res.statusText };
    }

    console.error('Login failed: status=' + res.status + ' statusText=' + res.statusText);

    throw new Error(error.detail || error.message || 'Login failed');
  }

  const data = await res.json();
  return data;
}

// Creates a new user account with the provided credentials
export async function signup(email: string, full_name: string, password: string) {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, full_name, password }),
  });
}

// Creates a new loan application with the provided form data
export async function createLoanApplication(data: FormData, token?: string) {
  if (!token) {
    console.error('No token provided to createLoanApplication');
    throw new Error('Authentication required');
  }

  const cleanToken = token.replace(/^Bearer\s+/i, '');
  
  return request('/loans/applications', {
    method: 'POST',
    body: data,
    headers: {
      'Authorization': `Bearer ${cleanToken}`
    }
  });
}

// Retrieves all loan applications for the current authenticated user
export async function getMyApplications(token?: string) {
  const response = await request<ApplicationResponse[]>('/loans/my-applications', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.map(transformToApplicant);
}

interface StatusCounts {
  total: number;
  approved: number;
  denied: number;
  cancelled: number;
  pending: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  counts: StatusCounts;
}

// Retrieves paginated loan applications with optional status and search filters
export async function getAllApplications(
  token?: string, 
  page: number = 1, 
  pageSize: number = 10,
  status?: string,
  search?: string
): Promise<PaginatedResponse<Applicant>> {
  if (!token) {
    console.error('No token provided to getAllApplications');
    throw new Error('Authentication required');
  }

  const skip = (page - 1) * pageSize;
  
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: pageSize.toString()
  });

  if (status && status !== 'all') {
    params.append('status', status);
  }
  if (search) {
    params.append('search', search);
  }

  const headers = {
    'Authorization': token,
    'Accept': 'application/json'
  };

  try {
    const response = await request<{
      data: ApplicationResponse[];
      total: number;
      page: number;
      pages: number;
      counts: StatusCounts;
    }>(`/loans/applications?${params.toString()}`, {
      method: 'GET',
      headers
    });

    return {
      data: response.data.map(transformToApplicant),
      total: response.total,
      page: response.page,
      pages: response.pages,
      counts: response.counts
    };
  } catch (error) {
    console.error('Error fetching applications:', error instanceof Error ? error.message : 'Unknown error');
    throw error instanceof Error ? error : new Error('Failed to fetch applications');
  }
}

// Updates the status of a loan application
export async function updateApplicationStatus(
  applicationId: string, 
  status: 'approved' | 'denied' | 'cancelled' | 'pending', 
  token?: string
) {
  const validStatuses: Record<string, string> = {
    'approved': 'Approved',
    'denied': 'Denied',
    'cancelled': 'Cancelled',
    'pending': 'Pending'
  };

  const normalizedStatus = status.toLowerCase();
  const mappedStatus = validStatuses[normalizedStatus];

  if (!mappedStatus) {
    throw new Error(`Invalid status. Valid statuses are: ${Object.keys(validStatuses).join(', ')}`);
  }

  try {
    const response = await request(`/loans/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ 
        status: mappedStatus
      }),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response;
  } catch (error) {
    console.error('Status update error:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to update application status');
    }
    throw error;
  }
}

// Retrieves detailed information for a specific loan application including documents
export async function getLoanApplication(applicationId: string, token?: string) {
  if (!token) {
    console.error('No token provided to getLoanApplication');
    throw new Error('Authentication required');
  }

  const headers = {
    'Authorization': token,
    'Accept': 'application/json'
  };

  try {
    const applicationData = await request<ApplicationResponse>(`/loans/applications/id/${applicationId}`, {
      method: 'GET',
      headers
    });

    try {
      try {
        const documentData = await request<Record<string, string | null>>(`/documents/application/${applicationId}`, {
          method: 'GET',
          headers
        });

        return {
          ...applicationData,
          documents: documentData
        };
      } catch (docError) {
        return {
          ...applicationData,
          documents: {
            brgy_cert_url: null,
            e_signature_personal_url: null,
            payslip_url: null,
            company_id_url: null,
            proof_of_billing_url: null,
            e_signature_comaker_url: null,
            profile_photo_url: null,
            valid_id_url: null
          }
        };
      }
    } catch (docError) {
      console.error('Failed to fetch application details:', docError);
      throw docError instanceof Error ? docError : new Error('Failed to fetch application details');
    }
  } catch (error) {
    console.error('Error fetching application details:', error instanceof Error ? error.message : 'Unknown error');
    throw error instanceof Error ? error : new Error('Failed to fetch application details');
  }
}

// Creates a demo loan application for testing purposes
export async function createDemoLoanApplication(params: Record<string, any>, token?: string) {
  const searchParams = new URLSearchParams(params).toString();
  return request(`/loans/applications/demo?${searchParams}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Updates an existing loan application with new form data
export async function updateLoanApplication(
  applicationId: string, 
  data: FormData,
  token?: string
) {
  if (!token) {
    console.error('No token provided to updateLoanApplication');
    throw new Error('Authentication required');
  }

  const cleanToken = token.replace(/^Bearer\s+/i, '');

  let hasRequestData = false;
  for (const [key] of data.entries()) {
    if (key === 'request_data') {
      hasRequestData = true;
      break;
    }
  }

  if (!hasRequestData) {
    console.error('request_data is missing from FormData');
    throw new Error('request_data is required for updating loan application');
  }
  
  return request(`/loans/applications/${applicationId}`, {
    method: 'PUT',
    body: data,
    headers: {
      'Authorization': `Bearer ${cleanToken}`
    }
  });
}

// Regenerates loan recommendations for a specific application
export async function regenerateLoanRecommendations(applicationId: string, token?: string) {
  return request(`/loans/applications/${applicationId}/regenerate-recommendations`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Deletes a loan application by its ID
export async function deleteLoanApplication(applicationId: string, token?: string) {
  return request(`/loans/applications/${applicationId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Uploads documents for a loan application
export async function uploadDocuments(applicationId: string, files: FormData, token?: string) {
  if (!token) {
    console.error('No token provided to uploadDocuments');
    throw new Error('Authentication required');
  }

  const cleanToken = token.replace(/^Bearer\s+/i, '');

  const timestamp = Date.now();
  return request(`/documents?application_id=${applicationId}&t=${timestamp}`, {
    method: 'POST',
    body: files,
    headers: {
      'Authorization': `Bearer ${cleanToken}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

// Retrieves a specific document by its ID
export async function getDocument(documentId: string, token?: string) {
  return request(`/documents/${documentId}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Retrieves all documents associated with a loan application
export async function getApplicationDocuments(applicationId: string, token?: string) {
  if (!token) {
    console.error('No token provided to getApplicationDocuments');
    throw new Error('Authentication required to fetch application documents');
  }
  try {
    return await request<Record<string, string | null>>(`/documents/application/${applicationId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.log('No documents found for application, returning empty document object');
    return {
      brgy_cert_url: null,
      e_signature_personal_url: null,
      payslip_url: null,
      company_id_url: null,
      proof_of_billing_url: null,
      e_signature_comaker_url: null,
      profile_photo_url: null,
      valid_id_url: null
    };
  }
}

// Updates existing documents for a loan application
export async function updateDocuments(documentId: string, files: FormData, token?: string) {
  if (!token) {
    console.error('No token provided to updateDocuments');
    throw new Error('Authentication required');
  }

  const cleanToken = token.replace(/^Bearer\s+/i, '');
  
  return request(`/documents/${documentId}`, {
    method: 'PUT',
    body: files,
    headers: {
      'Authorization': `Bearer ${cleanToken}`
    }
  });
}

// Deletes a document by its ID
export async function deleteDocument(documentId: string, token?: string) {
  return request(`/documents/${documentId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Deletes a single file from a loan application
export async function deleteSingleFile(applicationId: string, field: string, token?: string) {
  const timestamp = Date.now();
  return request(`/documents/application/${applicationId}/file/${field}?t=${timestamp}`, {
    method: 'DELETE',
    headers: token ? {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    } : {},
  });
}

// Refreshes document URLs for a loan application
export async function refreshApplicationDocumentUrls(
  applicationId: string,
  documentTypes?: string[],
  token?: string
) {
  if (!token) {
    console.error('No token provided to refreshApplicationDocumentUrls');
    throw new Error('Authentication required');
  }

  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(7);
  const version = Date.now().toString(36);
  
  const params = new URLSearchParams();
  if (documentTypes?.length) {
    params.append('document_types', documentTypes.join(','));
  }
  params.append('t', timestamp.toString());
  params.append('nonce', nonce);
  params.append('v', version);
  params.append('_', Math.random().toString());

  const headers = {
    Authorization: `Bearer ${token}`,
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'If-None-Match': `W/"${nonce}"`,
    'If-Modified-Since': new Date(0).toUTCString(),
    'X-Requested-With': 'XMLHttpRequest',
  };

  try {
    return await request<Record<string, string | null>>(
      `/documents/application/${applicationId}/refresh-urls?${params.toString()}`,
      {
        method: 'GET',
        headers
      }
    );
  } catch (error) {
    console.error('Failed to refresh document URLs:', error);
    throw error;
  }
}

// Checks if the loan service API is operational
export async function healthCheck() {
  return request('/loans/health', { method: 'GET' });
}

// Retrieves the current status of the loan service
export async function getServiceStatus(token?: string) {
  return request('/loans/service-status', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}