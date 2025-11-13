import React, { useState, useMemo, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Eye, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination';
import { Card, CardContent } from '../ui/card';
import { getAllApplications, updateApplicationStatus } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export interface Applicant {
  id: string;
  name: string;
  brgyCity: string;
  contact_number: string;
  loanProduct: string;
  loanAmount: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  formData: any;
  timestamp: string;
}

interface ApplicantsListProps {
  applicants: Applicant[];
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onViewEdit: (applicant: Applicant) => void;
}

export function ApplicantsList({
  onViewEdit,
}: Partial<ApplicantsListProps>) {
  const { user } = useAuth(); 
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [totalStats, setTotalStats] = useState({
    total: 0,
    approved: 0,
    denied: 0,
    cancelled: 0,
    pending: 0
  });
  const itemsPerPage = 6;

  useEffect(() => {
    if (!user) {
      setError('Authentication required');
    }
  }, [user]);

  const fetchApplications = async () => {
    const token = user?.token;
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, total, pages, counts } = await getAllApplications(
        token, 
        currentPage, 
        itemsPerPage,
        statusFilter !== 'all' ? statusFilter : undefined,
        searchQuery || undefined
      );

      setApplicants(data);
      setTotalPages(pages);
      setTotalStats({
        total: counts.total,
        approved: counts.approved,
        denied: counts.denied,
        cancelled: counts.cancelled,
        pending: counts.pending
      });

    } catch (error) {
      console.error('Failed to fetch applications');
      
      if (!token) {
        setError('Authentication required. Please log in.');
      } else if (error instanceof Error && error.message.includes('Not authenticated')) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to fetch applications. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!user?.token) {
      setError('Authentication required. Please log in.');
      return;
    }

    if (!isLoading) {
      fetchApplications();
    }
  }, [user?.token, currentPage, statusFilter, debouncedSearch]);

  const handleApprove = async (id: string) => {
    const token = user?.token;
    if (!token) {
      setError('Authentication required. Please log in.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      await updateApplicationStatus(id, 'approved', token);
      await fetchApplications();
    } catch (error) {
      console.error('Application approval failed');
      if (error instanceof Error && error.message.includes('Not authenticated')) {
        setError('Please log in to approve applications.');
      } else {
        setError('Failed to approve application. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeny = async (id: string) => {
    const token = user?.token;
    if (!token) {
      setError('Authentication required. Please log in.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await updateApplicationStatus(id, 'denied', token);
      await fetchApplications();
    } catch (error) {
      console.error('Application denial failed');
      if (error instanceof Error && error.message.includes('Not authenticated')) {
        setError('Please log in to deny applications.');
      } else {
        setError('Failed to deny application. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    const token = user?.token;
    if (!token) {
      setError('Authentication required. Please log in.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await updateApplicationStatus(id, 'cancelled', token);
      await fetchApplications();
    } catch (error) {
        console.error('Application cancellation failed');
      if (error instanceof Error && error.message.includes('Not authenticated')) {
        setError('Please log in to cancel applications.');
      } else {
        setError('Failed to cancel application. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const totalApplicants = totalStats.total;
  const approvedCount = totalStats.approved;
  const deniedCount = totalStats.denied;
  const cancelledCount = totalStats.cancelled;
  const pendingCount = totalStats.pending;

  const [totalPages, setTotalPages] = useState(1);

  const currentApplicants = applicants;
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getRowBorderClass = (status: string) => {
    if (status === 'approved') return 'border-l-4 border-l-green-500';
    if (status === 'denied') return 'border-l-4 border-l-red-500';
    if (status === 'cancelled') return 'border-l-4 border-l-gray-500';
    return '';
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden bg-white">
      {/* Header */}
      <div className="px-6 pt-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Applicant Management</h2>
          <p className="text-gray-500 text-sm">Review and manage all loan applications</p>
        </div>
      </div>

      {/* KPI cards - Enhanced styling with better spacing */}
      <div className="px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-center">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Total Applicants</p>
                <p className="text-4xl font-bold text-blue-900">{totalApplicants}</p>
                <p className="text-xs text-blue-600 mt-2">all submissions</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-center">
                <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-2">Pending</p>
                <p className="text-4xl font-bold text-yellow-900">{pendingCount}</p>
                <p className="text-xs text-yellow-600 mt-2">awaiting review</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-center">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Approved</p>
                <p className="text-4xl font-bold text-green-900">{approvedCount}</p>
                <p className="text-xs text-green-600 mt-2">approved</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-center">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Denied</p>
                <p className="text-4xl font-bold text-red-900">{deniedCount}</p>
                <p className="text-xs text-red-600 mt-2">rejected</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Cancelled</p>
                <p className="text-4xl font-bold text-gray-900">{cancelledCount}</p>
                <p className="text-xs text-gray-600 mt-2">withdrawn</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-6">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 flex items-start gap-3">
              <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-900 mb-1">Unable to Load Applications</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search - Improved layout */}
      <div className="px-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full h-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-gray-600 uppercase">Filter</SelectLabel>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by name, contact, product, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <Card className="h-full flex flex-col border-gray-200">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <TableRow>
                  <TableHead className="h-12 px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</TableHead>
                  <TableHead className="h-12 px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Brgy/City</TableHead>
                  <TableHead className="h-12 px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</TableHead>
                  <TableHead className="h-12 px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Loan Product</TableHead>
                  <TableHead className="h-12 px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</TableHead>
                  <TableHead className="h-12 px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex justify-center items-center flex-col gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                        <p className="text-gray-600 font-medium">Loading applications...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentApplicants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 3.5a7.5 7.5 0 0013.15 13.15z" />
                        </svg>
                        <p className="text-gray-500 font-medium">No applicants found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentApplicants.map((applicant) => (
                    <TableRow 
                      key={applicant.id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${getRowBorderClass(applicant.status)}`}
                    >
                      <TableCell className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div className="max-w-[180px]" title={applicant.name}>
                          {truncateText(applicant.name, 22)}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600">
                        <div className="max-w-[150px]" title={applicant.brgyCity}>
                          {truncateText(applicant.brgyCity, 18)}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600">
                        <div className="max-w-[200px]" title={applicant.contact_number}>
                          {truncateText(applicant.contact_number, 28)}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600">
                        {applicant.loanProduct}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm font-medium text-gray-900">
                        {applicant.loanAmount}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApprove(applicant.id)}
                            className={`h-9 w-9 p-0 rounded-lg transition-colors ${
                              applicant.status === 'approved' 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'hover:bg-green-50 hover:text-green-600 text-gray-400'
                            }`}
                            title="Approve Application"
                            disabled={isLoading}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeny(applicant.id)}
                            className={`h-9 w-9 p-0 rounded-lg transition-colors ${
                              applicant.status === 'denied'
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'hover:bg-red-50 hover:text-red-600 text-gray-400'
                            }`}
                            title="Deny Application"
                            disabled={isLoading}
                          >
                            <XCircle className="h-5 w-5" />
                          </Button>
                          {onViewEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onViewEdit(applicant)}
                              className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors"
                              title="View/Edit Details"
                              disabled={isLoading}
                            >
                              <Eye className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center px-6 pb-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-100 rounded-lg'}
                  title={currentPage <= 1 ? 'No previous page' : 'Go to previous page'}
                />
              </PaginationItem>
              
              {(() => {
                const pages = [];
                
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  if (currentPage <= 3) {
                    for (let i = 1; i <= Math.min(4, totalPages); i++) {
                      pages.push(i);
                    }
                    if (totalPages > 4) pages.push('...');
                  } else if (currentPage >= totalPages - 2) {
                    pages.push('...');
                    for (let i = Math.max(1, totalPages - 3); i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...');
                  }
                }
                
                return pages.map((page, idx) => (
                  <PaginationItem key={`${page}-${idx}`}>
                    {page === '...' ? (
                      <span className="px-3 py-2 text-gray-500">...</span>
                    ) : (
                      <PaginationLink
                        onClick={() => setCurrentPage(page as number)}
                        isActive={currentPage === page}
                        className={`cursor-pointer rounded-lg transition-colors ${
                          currentPage === page 
                            ? 'bg-red-600 text-white' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ));
              })()}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-100 rounded-lg'}
                  title={currentPage >= totalPages ? 'No next page' : 'Go to next page'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}