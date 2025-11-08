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
  email: string;
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
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-blue-600 mb-1">Total Applicants</p>
              <p className="text-3xl text-blue-700">{totalApplicants}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-yellow-600 mb-1">Pending</p>
              <p className="text-3xl text-yellow-700">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-green-600 mb-1">Approved</p>
              <p className="text-3xl text-green-700">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-red-600 mb-1">Denied</p>
              <p className="text-3xl text-red-700">{deniedCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Cancelled</p>
              <p className="text-3xl text-gray-700">{cancelledCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Application Status</SelectLabel>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, email, loan product, or amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="flex-1 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Name</TableHead>
              <TableHead className="w-[150px]">Brgy/City</TableHead>
              <TableHead className="w-[200px]">Email</TableHead>
              <TableHead className="w-[160px]">Loan Product</TableHead>
              <TableHead className="w-[130px]">Loan Amount</TableHead>
              <TableHead className="w-[120px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading applications...
                  </div>
                </TableCell>
              </TableRow>
            ) : currentApplicants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No applicants found
                </TableCell>
              </TableRow>
            ) : (
              currentApplicants.map((applicant) => (
                <TableRow key={applicant.id} className={getRowBorderClass(applicant.status)}>
                  <TableCell>
                    <div className="max-w-[180px]" title={applicant.name}>
                      {truncateText(applicant.name, 22)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[150px]" title={applicant.brgyCity}>
                      {truncateText(applicant.brgyCity, 18)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]" title={applicant.email}>
                      {truncateText(applicant.email, 28)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-normal break-words">
                      {applicant.loanProduct}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-normal break-words">
                      {applicant.loanAmount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApprove(applicant.id)}
                        className={`h-8 w-8 p-0 ${
                          applicant.status === 'approved' 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'hover:bg-green-50 hover:text-green-600'
                        }`}
                        title="Approve"
                        disabled={isLoading}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeny(applicant.id)}
                        className={`h-8 w-8 p-0 ${
                          applicant.status === 'denied'
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'hover:bg-red-50 hover:text-red-600'
                        }`}
                        title="Deny"
                        disabled={isLoading}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      {onViewEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewEdit(applicant)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          title="View/Edit"
                          disabled={isLoading}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-100'}
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
                      <span className="px-4 py-2">...</span>
                    ) : (
                      <PaginationLink
                        onClick={() => setCurrentPage(page as number)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
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
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-100'}
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