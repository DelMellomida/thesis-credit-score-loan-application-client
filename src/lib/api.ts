// API utility functions for Next.js client
// Uses NEXT_PUBLIC_API_URL from .env.local

import type { Applicant } from '@/components/ApplicantList';
import { transformToApplicant } from './transformData';
import type { ApplicationResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Custom type for request headers
type RequestHeaders = Record<string, string> & {
  'Content-Type'?: string;
  'Accept'?: string;
  'Authorization'?: string;
};

// Helper for requests
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Start with default headers
  const defaultHeaders: RequestHeaders = {};
  
  // Only set default Content-Type if we're not sending FormData
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
    defaultHeaders['Accept'] = 'application/json';
  }

  // Combine with provided headers and ensure Authorization is properly formatted
  const headers: RequestHeaders = {
    ...defaultHeaders,
    ...((options.headers as RequestHeaders) || {})
  };

  // Format Authorization header if present (do not log sensitive token values)
  if (headers.Authorization) {
    const token = headers.Authorization;
    if (!token) {
      delete headers.Authorization;
    } else {
      // Add Bearer prefix if not already present
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      headers.Authorization = formattedToken;
    }
  }

  // Try to execute the request with automatic token refresh on 401
  const executeRequest = async (shouldRefresh = true): Promise<T> => {
    const requestUrl = `${API_URL}${endpoint}`;
    const hasAuth = 'Authorization' in headers;

    try {
      // Add comprehensive cache-busting for document URLs
      const isDocumentRequest = endpoint.startsWith('/documents/');
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const url = isDocumentRequest 
        ? `${requestUrl}${requestUrl.includes('?') ? '&' : '?'}t=${timestamp}&noCache=${random}&v=${timestamp}`
        : requestUrl;

      // Add cache control headers for document requests
      if (isDocumentRequest) {
        // Set strict cache control headers
        headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
        headers['Surrogate-Control'] = 'no-store';
        headers['If-None-Match'] = `"${timestamp}-${random}"`; // Unique ETag
        headers['If-Modified-Since'] = new Date(0).toUTCString(); // Force revalidation
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      // Response received - avoid logging potentially sensitive headers or tokens

      if (!response.ok) {
        // Handle 401 Unauthorized with token refresh
        if (response.status === 401 && shouldRefresh && headers.Authorization) {
          // Get stored user data
          const storedUser = localStorage.getItem('authUser');
          if (!storedUser) {
            throw new Error('Authentication required');
          }

          const user = JSON.parse(storedUser);

          try {
            // Attempt to refresh the token
            const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
              }
            });

            if (!refreshResponse.ok) {
              // If refresh fails, clear authentication and throw error
              localStorage.removeItem('authUser');
              window.dispatchEvent(new Event('auth-error'));
              throw new Error('Session expired. Please log in again.');
            }

            // Get new token
            const { access_token } = await refreshResponse.json();

            // Update stored user data
            user.token = access_token;
            localStorage.setItem('authUser', JSON.stringify(user));

            // Update Authorization header with new token
            headers.Authorization = `Bearer ${access_token}`;

            // Retry the original request with the new token
            return executeRequest(false);
          } catch (error) {
            console.error('Token refresh failed:', error);
            throw error;
          }
        }

        // Handle non-401 errors
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

// Transform backend response to frontend Applicant type is now imported from './transformData'

// Auth endpoints
export async function login(username: string, password: string) {
  // FastAPI expects x-www-form-urlencoded for OAuth2
  const body = new URLSearchParams({
    username: username,
    password: password,
    grant_type: 'password'  // Required for OAuth2 password flow
  });

  // Attempting login

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
  // Do not log tokens or sensitive login response data

  return data;
}

export async function signup(email: string, full_name: string, password: string) {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, full_name, password }),
  });
}

// Loan application endpoints
export async function createLoanApplication(data: FormData, token?: string) {
  if (!token) {
    console.error('No token provided to createLoanApplication');
    throw new Error('Authentication required');
  }

  // Remove any existing 'Bearer ' prefix
  const cleanToken = token.replace(/^Bearer\s+/i, '');
  // Do not log tokens or FormData contents (may contain PII)
  
  return request('/loans/applications', {
    method: 'POST',
    body: data,
    headers: {
      'Authorization': `Bearer ${cleanToken}`
    }
  });
}

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
  
  // Build query string with filters
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: pageSize.toString()
  });

  // Add optional filters
  if (status && status !== 'all') {
    params.append('status', status);
  }
  if (search) {
    params.append('search', search);
  }

  // Use token directly without modification - let the request helper handle Bearer prefix
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

    // Successfully fetched applications

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

  // Sending status update (no sensitive logging)

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

export async function getLoanApplication(applicationId: string, token?: string) {
  if (!token) {
    console.error('No token provided to getLoanApplication');
    throw new Error('Authentication required');
  }

  // Fetching full application details

  // Use token directly - let request helper handle Bearer prefix
  const headers = {
    'Authorization': token,
    'Accept': 'application/json'
  };

  try {
    // First get the application data using the MongoDB ID endpoint
    const applicationData = await request<ApplicationResponse>(`/loans/applications/id/${applicationId}`, {
      method: 'GET',
      headers
    });

  // Received application details

    try {
      // Then get the document URLs
      // Attempt to fetch document data, provide empty object if it fails or returns 404
      try {
        const documentData = await request<Record<string, string | null>>(`/documents/application/${applicationId}`, {
          method: 'GET',
          headers
        });
  // Document URLs fetched

        // Combine the data
        return {
          ...applicationData,
          documents: documentData
        };
      } catch (docError) {
  // No documents found
        // Return empty document URLs if request fails
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

// Demo loan application (for presentations/testing)
export async function createDemoLoanApplication(params: Record<string, any>, token?: string) {
  // params should match backend demo endpoint fields
  const searchParams = new URLSearchParams(params).toString();
  return request(`/loans/applications/demo?${searchParams}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Update loan application
export async function updateLoanApplication(
  applicationId: string, 
  data: FormData,
  token?: string
) {
  if (!token) {
    console.error('No token provided to updateLoanApplication');
    throw new Error('Authentication required');
  }

  // Remove any existing 'Bearer ' prefix
  const cleanToken = token.replace(/^Bearer\s+/i, '');
  // Updating loan application (no sensitive logging)

  // Ensure request_data exists in FormData
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

  // Log the FormData contents for debugging
  // Do not log FormData contents (may contain PII)
  
  return request(`/loans/applications/${applicationId}`, {
    method: 'PUT',
    body: data,
    headers: {
      'Authorization': `Bearer ${cleanToken}`
    }
  });
}

// Regenerate loan recommendations
export async function regenerateLoanRecommendations(applicationId: string, token?: string) {
  return request(`/loans/applications/${applicationId}/regenerate-recommendations`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Delete loan application
export async function deleteLoanApplication(applicationId: string, token?: string) {
  return request(`/loans/applications/${applicationId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Document management endpoints
export async function uploadDocuments(applicationId: string, files: FormData, token?: string) {
  if (!token) {
    console.error('No token provided to uploadDocuments');
    throw new Error('Authentication required');
  }

  // Remove any existing 'Bearer ' prefix
  const cleanToken = token.replace(/^Bearer\s+/i, '');
  // Uploading documents (do not log tokens or file contents)

  // Ensure we have a fresh URL each time
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

export async function getDocument(documentId: string, token?: string) {
  return request(`/documents/${documentId}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

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
    // Return empty document URLs if request fails
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

export async function updateDocuments(documentId: string, files: FormData, token?: string) {
  if (!token) {
    console.error('No token provided to updateDocuments');
    throw new Error('Authentication required');
  }

  // Remove any existing 'Bearer ' prefix
  const cleanToken = token.replace(/^Bearer\s+/i, '');
  
  return request(`/documents/${documentId}`, {
    method: 'PUT',
    body: files,
    headers: {
      'Authorization': `Bearer ${cleanToken}`
    }
  });
}

export async function deleteDocument(documentId: string, token?: string) {
  return request(`/documents/${documentId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

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

export async function refreshApplicationDocumentUrls(
  applicationId: string,
  documentTypes?: string[],
  token?: string
) {
  if (!token) {
    console.error('No token provided to refreshApplicationDocumentUrls');
    throw new Error('Authentication required');
  }

  const timestamp = Date.now(); // Add timestamp to prevent caching
  const queryString = documentTypes?.length 
    ? `?document_types=${documentTypes.join(',')}&t=${timestamp}`
    : `?t=${timestamp}`;

  return request<Record<string, string | null>>(
    `/documents/application/${applicationId}/refresh-urls${queryString}`,
    {
      method: 'GET',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  );
}

// Health check endpoints
export async function healthCheck() {
  return request('/loans/health', { method: 'GET' });
}

export async function getServiceStatus(token?: string) {
  return request('/loans/service-status', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
