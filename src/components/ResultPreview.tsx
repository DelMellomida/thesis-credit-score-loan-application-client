import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Printer, ZoomIn, ZoomOut } from 'lucide-react';
import { FormData } from '../app/page';

interface ResultPreviewProps {
  formData: FormData;
  loanResult?: any;
}

export function ResultPreview({ formData, loanResult }: ResultPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  // Use backend result if available
  const loanRecommendation = loanResult && loanResult.prediction_result
    ? {
        amount:
          loanResult.recommended_products && loanResult.recommended_products.length > 0 && typeof loanResult.recommended_products[0].max_loanable_amount === 'number'
            ? loanResult.recommended_products[0].max_loanable_amount.toLocaleString('en-PH', {
                style: 'currency',
                currency: 'PHP'
              })
            : 'N/A',
        product: loanResult.recommended_products && loanResult.recommended_products.length > 0
          ? loanResult.recommended_products[0].product_name
          : 'N/A',
        reasons: loanResult.ai_explanation
          ? [loanResult.ai_explanation.customer_explanation, loanResult.ai_explanation.business_explanation].filter(Boolean)
          : ['No AI explanation available'],
      }
    : (() => {
        // fallback to local calculation
        const salary = parseFloat(formData.employee.salary) || 0;
        const coMakerSalary = parseFloat(formData.coMaker.salary) || 0;
        const totalIncome = salary + coMakerSalary;
        let recommendedAmount = 0;
        let product = '';
        let reasons = [];
        if (totalIncome >= 50000) {
          recommendedAmount = totalIncome * 5;
          product = 'Premium Loan Package';
          reasons = [
            'High combined income capacity',
            'Stable employment with good salary',
            'Strong co-maker support'
          ];
        } else if (totalIncome >= 30000) {
          recommendedAmount = totalIncome * 3;
          product = 'Standard Loan Package';
          reasons = [
            'Good income stability',
            'Adequate monthly salary',
            'Co-maker provides additional security'
          ];
        } else if (totalIncome >= 15000) {
          recommendedAmount = totalIncome * 2;
          product = 'Basic Loan Package';
          reasons = [
            'Moderate income level',
            'Basic repayment capacity',
            'Co-maker support available'
          ];
        } else {
          recommendedAmount = totalIncome * 1.5;
          product = 'Micro Loan Package';
          reasons = [
            'Entry-level loan product',
            'Manageable repayment terms',
            'Building credit history'
          ];
        }
        return {
          amount: recommendedAmount.toLocaleString('en-PH', {
            style: 'currency',
            currency: 'PHP'
          }),
          product,
          reasons
        };
      })();

  const handlePrint = () => {
    window.print();
  };

  const renderFrontPage = () => (
    <div className="space-y-6 text-sm">
      <div className="text-center border-b pb-4">
        <h3 className="font-semibold text-lg">LOAN APPLICATION SUMMARY</h3>
        <p className="text-gray-600">Best Loan Company</p>
      </div>

      <div>
        <h4 className="font-semibold text-red-600 mb-3">PERSONAL INFORMATION</h4>
        <div className="space-y-1">
          <p><span className="font-medium">Name:</span> {formData.personal.fullName || 'N/A'}</p>
          <p><span className="font-medium">Contact:</span> {formData.personal.contactNo || 'N/A'}</p>
          <p><span className="font-medium">Address:</span> {formData.personal.address || 'N/A'}</p>
          <p><span className="font-medium">Head of Household:</span> {formData.personal.headOfHousehold || 'N/A'}</p>
          <p><span className="font-medium">Dependents:</span> {formData.personal.dependents || 'N/A'}</p>
          <p><span className="font-medium">Years Living:</span> {formData.personal.yearsLivingHere || 'N/A'}</p>
          <p><span className="font-medium">Housing:</span> {formData.personal.housingStatus || 'N/A'}</p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-red-600 mb-3">EMPLOYMENT INFORMATION</h4>
        <div className="space-y-1">
          <p><span className="font-medium">Company:</span> {formData.employee.companyName || 'N/A'}</p>
          <p><span className="font-medium">Sector:</span> {formData.employee.sector || 'N/A'}</p>
          <p><span className="font-medium">Position:</span> {formData.employee.position || 'N/A'}</p>
          <p><span className="font-medium">Duration:</span> {formData.employee.employmentDuration || 'N/A'}</p>
          <p><span className="font-medium">Salary:</span> {formData.employee.salary ? `₱${formData.employee.salary}` : 'N/A'}</p>
          <p><span className="font-medium">Salary Type:</span> {formData.employee.typeOfSalary || 'N/A'}</p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-red-600 mb-3">OTHER INFORMATION</h4>
        <div className="space-y-1">
          <p><span className="font-medium">Community Position:</span> {formData.other.communityPosition || 'N/A'}</p>
          <p><span className="font-medium">Paluwaga:</span> {formData.other.paluwagaParticipation || 'N/A'}</p>
          <p><span className="font-medium">Other Income:</span> {formData.other.otherIncomeSources || 'N/A'}</p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-red-600 mb-3">CO-MAKER INFORMATION</h4>
        <div className="space-y-1">
          <p><span className="font-medium">Name:</span> {formData.coMaker.fullName || 'N/A'}</p>
          <p><span className="font-medium">Contact:</span> {formData.coMaker.contactNo || 'N/A'}</p>
          <p><span className="font-medium">Address:</span> {formData.coMaker.address || 'N/A'}</p>
          <p><span className="font-medium">Relationship:</span> {formData.coMaker.relationshipWithApplicant || 'N/A'}</p>
          <p><span className="font-medium">Salary:</span> {formData.coMaker.salary ? `₱${formData.coMaker.salary}` : 'N/A'}</p>
        </div>
      </div>
    </div>
  );

  const renderBackPage = () => (
    <div className="space-y-6 text-sm">
      <div className="text-center border-b pb-4">
        <h3 className="font-semibold text-lg">LOAN RECOMMENDATION</h3>
        <p className="text-gray-600">Best Loan Company</p>
      </div>

      <div className="bg-red-50 p-4 rounded-lg">
        <h4 className="font-semibold text-red-600 mb-3">RECOMMENDED LOAN PACKAGE</h4>
        <div className="space-y-2">
          <p><span className="font-medium">Product:</span> {loanRecommendation.product}</p>
          <p><span className="font-medium">Recommended Amount:</span> <span className="text-xl font-bold text-red-600">{loanRecommendation.amount}</span></p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-red-600 mb-3">RECOMMENDATION REASONS</h4>
        <ul className="space-y-2">
          {loanRecommendation.reasons.map((reason, index) => (
            <li key={index} className="flex items-start">
              <span className="text-red-600 mr-2">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">NEXT STEPS</h4>
        <ol className="space-y-1 text-sm">
          <li>1. Review loan terms and conditions</li>
          <li>2. Submit required documents</li>
          <li>3. Schedule final interview</li>
          <li>4. Await loan approval</li>
        </ol>
      </div>

      <div className="text-center text-xs text-gray-500 border-t pt-4">
        <p>Generated on: {new Date().toLocaleDateString()}</p>
        <p>This is a preliminary assessment. Final loan approval subject to verification.</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Screen Display - Hidden during print */}
      <Card className="w-96 h-full no-print">
        <CardHeader className="p-3 bg-gray-800 text-white">
          <CardTitle className="text-center">RESULT PREVIEW</CardTitle>
        </CardHeader>
        
        <CardContent className="p-4">
          {/* Zoom Controls */}
          <div className="flex justify-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              className="border-red-600 text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-3 text-sm font-medium">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2}
              className="border-red-600 text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* FIXED 620PX Receipt Content Container */}
          <div 
            className="overflow-hidden border rounded bg-gray-50 relative"
            style={{ height: '400px' }}
          >
            <div 
              className="overflow-auto bg-white w-full h-full"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left',
                width: `${100 / zoomLevel}%`,
                height: `${100 / zoomLevel}%`,
              }}
            >
              <div className="p-6" style={{ minHeight: '620px' }}>
                {currentPage === 1 ? renderFrontPage() : renderBackPage()}
              </div>
            </div>
          </div>

          {/* Navigation Buttons - Always Visible Below Receipt */}
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              onClick={() => setCurrentPage(1)}
              size="sm"
              className={currentPage === 1 ? "bg-red-600 hover:bg-red-700 cursor-pointer" : "border-red-600 text-red-600 hover:bg-red-50 cursor-pointer"}
            >
              1
            </Button>
            <Button
              variant={currentPage === 2 ? "default" : "outline"}
              onClick={() => setCurrentPage(2)}
              size="sm"
              className={currentPage === 2 ? "bg-red-600 hover:bg-red-700 cursor-pointer" : "border-red-600 text-red-600 hover:bg-red-50 cursor-pointer"}
            >
              2
            </Button>
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white ml-2 cursor-pointer"
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Print-Only Layout - Two Columns Side by Side */}
      <div className="print-only">
        <div className="print-page">
          <div className="flex h-full">
            {/* Left Column - Front Page */}
            <div className="w-1/2 pr-4 border-r border-gray-300">
              <div className="p-2 text-xs h-full">
                {renderFrontPage()}
              </div>
            </div>
            
            {/* Right Column - Back Page */}
            <div className="w-1/2 pl-4">
              <div className="p-2 text-xs h-full">
                {renderBackPage()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Print Styles */}
      <style jsx global>{`
        @media screen {
          .print-only {
            display: none !important;
          }
        }

        @media print {
          * {
            visibility: hidden;
          }
          
          .print-only, .print-only * {
            visibility: visible;
          }
          
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: block !important;
          }
          
          .print-page {
            page-break-before: always;
            width: 100%;
            min-height: 100vh;
            margin: 0;
            padding: 0;
            position: relative;
          }
          
          .print-page:first-child {
            page-break-before: auto;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          @page {
            A4;
          }
          
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>
    </>
  );
}