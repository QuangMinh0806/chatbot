import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Save, Loader2, AlertCircle, CheckCircle, BarChart3, Download, ExternalLink, Edit3, TestTube, Database, Users } from 'lucide-react';
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { format } from "date-fns";
import { export_sheet, get_mapping, update_mapping } from '../../services/exportService';
import { getFieldConfig, updateFieldConfig } from '../../services/fieldConfigService';
import { getCustomerInfor } from '../../services/userService';
import CustomerConfigForm from '../../components/exportData/CustomerConfigForm';
import TableMapping from '../../components/exportData/TableMapping';
import PageLayout from '../../components/common/PageLayout';
const ExportData = () => {
    const [mappings, setMappings] = useState({});
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [updateConfigLoading, setUpdateConfigLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [exportResult, setExportResult] = useState(null);
    const [config, setConfig] = useState([]);
    const [requiredFields, setRequiredFields] = useState([]);
    const [optionalFields, setOptionalFields] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [refresh, setRefresh] = useState(0);
    const [activeTab, setActiveTab] = useState('googlesheet'); // Tab state
    
    // Customer table states
    const [customers, setCustomers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const openModal = () => setShowModal(true);
    const closeModal = () => setShowModal(false);

    const fieldConfig = config[0];
    const customerFields = [];

    if (fieldConfig?.thongtinbatbuoc) {
        Object.entries(fieldConfig.thongtinbatbuoc).forEach(([key, label]) => {
            customerFields.push({
                key,
                label,
                required: true
            });
        });
    }

    if (fieldConfig?.thongtintuychon) {
        Object.entries(fieldConfig.thongtintuychon).forEach(([key, label]) => {
            customerFields.push({
                key,
                label,
                required: false
            });
        });
    }
    const loadMapping = async () => {
        try {
            setLoading(true);
            const [mappingResponse, fieldConfigResponse] = await Promise.all([
                get_mapping(),
                getFieldConfig()
            ]);
            setConfig(fieldConfigResponse);
            let mappingData = {};
            if (Array.isArray(mappingResponse)) {
                mappingResponse.forEach((col) => {
                    mappingData[col] = "";
                });
            } else if (mappingResponse && Object.keys(mappingResponse).length > 0) {
                mappingData = mappingResponse;
            } else {
                ["A", "B", "C", "D", "E"].forEach((col) => {
                    mappingData[col] = "";
                });
            }
            setMappings(mappingData);
            showMessage('success', 'Đã tải danh sách cột từ Google Sheet');
        } catch (error) {
            console.error('Error loading mapping:', error);
            showMessage('error', 'Lỗi khi tải mapping: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const exportToGoogleSheets = async () => {
        try {
            setExportLoading(true);
            const response = await export_sheet();

            if (response.success) {
                setExportResult(response);
                showMessage('success', `${response.message} (${response.count} bản ghi)`);
            } else {
                throw new Error(response.message || 'Không thể export dữ liệu');
            }
        } catch (error) {
            console.error('Export error:', error);
            showMessage('error', 'Lỗi khi export: ' + error.message);
        } finally {
            setExportLoading(false);
        }
    };

    const saveMapping = async () => {
        try {
            setLoading(true);
            // chuyển từ key sang label
            const mappingToSave = {};
            Object.entries(mappings).forEach(([col, fieldKey]) => {
                const field = customerFields.find(f => f.key === fieldKey);
                mappingToSave[col] = field ? field.label : fieldKey;
            });

            const response = await update_mapping(mappingToSave);
            showMessage('success', response.message || 'Lưu mapping thành công');
        } catch (error) {
            console.error('Save mapping error:', error);
            showMessage('error', 'Lỗi khi lưu mapping: ' + error.message);
        } finally {
            setLoading(false);
        }
    };


    const updateConfig = async () => {
        try {
            setUpdateConfigLoading(true);

            if (!fieldConfig || !fieldConfig.id) {
                throw new Error('Không tìm thấy config để cập nhật');
            }

            const requiredFieldsObj = {};
            const optionalFieldsObj = {};
            console.log(requiredFields, optionalFields)
            requiredFields.forEach(field => {
                if (field.key && field.label) {
                    requiredFieldsObj[field.key] = field.label;
                }
            });

            optionalFields.forEach(field => {
                if (field.key && field.label) {
                    optionalFieldsObj[field.key] = field.label;
                }
            });

            const updateData = {
                thongtinbatbuoc: requiredFieldsObj,
                thongtintuychon: optionalFieldsObj
            };
            const response = await updateFieldConfig(fieldConfig.id, updateData);
            if (response) {
                setConfig([response]);
                showMessage('success', 'Cập nhật cấu hình thành công');
                setRefresh(prev => prev + 1);
                closeModal();
            } else {
                throw new Error('Không thể cập nhật cấu hình');
            }
        } catch (error) {
            console.error('Update config error:', error);
            showMessage('error', 'Lỗi khi cập nhật cấu hình: ' + error.message);
        } finally {
            setUpdateConfigLoading(false);
        }
    };

    const loadFieldsForModal = () => {
        if (fieldConfig?.thongtinbatbuoc) {
            const required = Object.entries(fieldConfig.thongtinbatbuoc).map(([key, label]) => ({
                id: Date.now() + Math.random(),
                key,
                label
            }));
            setRequiredFields(required);
        }

        if (fieldConfig?.thongtintuychon) {
            const optional = Object.entries(fieldConfig.thongtintuychon).map(([key, label]) => ({
                id: Date.now() + Math.random(),
                key,
                label
            }));
            setOptionalFields(optional);
        }
    };

    const showMessage = (type, content) => {
        setMessage({ type, content });
        setTimeout(() => {
            setMessage({ type: '', content: '' });
        }, 5000);
    };

    const openInNewTab = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleOpenModal = () => {
        loadFieldsForModal();
        openModal();
    };

    useEffect(() => {
        loadMapping();
        // Load customer data
        const fetchCustomerData = async () => {
            const data = await getCustomerInfor();
            setCustomers(data);
        };
        fetchCustomerData();
    }, [refresh]);

    // Tab configuration
    const tabs = [
        {
            id: 'googlesheet',
            name: 'Dữ liệu khách hàng trên GG Sheet',
            icon: Database,
            description: 'Ánh xạ và xuất dữ liệu khách hàng lên Google Sheets'
        },
        {
            id: 'system',
            name: 'Dữ liệu khách hàng trong hệ thống',
            icon: Users,
            description: 'Xem và quản lý dữ liệu khách hàng trong hệ thống'
        }
    ];

    // Customer table calculations
    const totalPages = Math.ceil(customers.length / itemsPerPage);
    const currentData = useMemo(
        () =>
            customers.slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
            ),
        [customers, currentPage]
    );

    const renderGoogleSheetContent = () => {
        return (
            <div className="space-y-6">
                {/* Message Display */}
                {message.content && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 border ${message.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        {message.type === 'success'
                            ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            : <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        }
                        <span className="font-medium">{message.content}</span>
                    </div>
                )}

                {/* Warning */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm">⚠</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-1">Lưu ý quan trọng</h3>
                            <p className="text-blue-800 text-sm">
                                Bạn cần ánh xạ thủ công các trường thông tin với cột Google Sheets để đảm bảo dữ liệu được xuất chính xác.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={loadMapping}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Tải columns từ Lead Sheet
                    </button>

                    <button
                        onClick={exportToGoogleSheets}
                        disabled={exportLoading}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Export dữ liệu
                    </button>

                    <button
                        onClick={handleOpenModal}
                        disabled={updateConfigLoading}
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {updateConfigLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                        Cập nhật cấu hình
                    </button>
                </div>

                {/* Export Result */}
                {exportResult && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-green-800 mb-1">Export thành công!</h3>
                                <p className="text-green-700 text-sm">
                                    Đã export <span className="font-semibold">{exportResult.count}</span> bản ghi sang Google Sheets
                                </p>
                                {exportResult.url && (
                                    <button
                                        onClick={() => openInNewTab(exportResult.url)}
                                        className="mt-2 text-green-600 hover:text-green-800 underline text-sm"
                                    >
                                        Xem file đã export
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Google Sheets Link */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Link Google Sheets</h3>
                            <p className="text-gray-600 text-sm">Truy cập trực tiếp đến Google Sheets</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={exportResult?.url || "https://docs.google.com/spreadsheets/d/1eci4KfF4VNQop9j63mnaKys1N3g3gJ3bdWpsgEE4wJs/edit?usp=sharing"}
                            readOnly
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 focus:outline-none font-mono text-sm"
                        />
                        <button
                            onClick={() => openInNewTab(exportResult?.url || "https://docs.google.com/spreadsheets/d/1eci4KfF4VNQop9j63mnaKys1N3g3gJ3bdWpsgEE4wJs/edit?usp=sharing")}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            title="Mở trong tab mới"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Mở Sheet
                        </button>
                    </div>
                </div>

                {/* Mapping Table */}
                <TableMapping 
                    mappings={mappings}
                    setMappings={setMappings}
                    loading={loading}
                    customerFields={customerFields} 
                />

                {/* Save Mapping Buttons */}
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    <button
                        onClick={saveMapping}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu cấu hình
                    </button>

                    <button
                        onClick={loadMapping}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                        Kiểm tra kết nối
                    </button>
                </div>
            </div>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'googlesheet':
                return renderGoogleSheetContent();
            case 'system':
                return (
                    <div className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 tracking-tight">
                            Customer Information
                        </h2>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full text-sm text-gray-900">
                                <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">
                                            Chat Session ID
                                        </th>
                                        <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">
                                            Ngày tạo
                                        </th>
                                        <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">
                                            Thông tin khách hàng
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentData.map((cust, index) => (
                                        <tr
                                            key={cust.id}
                                            className={`${
                                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                            } hover:bg-blue-50 transition-colors duration-200`}
                                        >
                                            <td className="px-6 py-4 font-bold text-blue-700">
                                                {cust.chat_session_id}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {format(new Date(cust.created_at), "yyyy-MM-dd HH:mm:ss")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="grid grid-cols-2 gap-y-2 gap-x-6">
                                                    <div>
                                                        <span className="font-bold text-gray-800">Name:</span>{" "}
                                                        {cust.customer_data?.name || "N/A"}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-800">Email:</span>{" "}
                                                        {cust.customer_data?.email || "N/A"}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-800">Phone:</span>{" "}
                                                        {cust.customer_data?.phone || "N/A"}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-800">Address:</span>{" "}
                                                        {cust.customer_data?.address || "N/A"}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-800">Class:</span>{" "}
                                                        {cust.customer_data?.class || "N/A"}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-800">Registration:</span>{" "}
                                                        {cust.customer_data?.registration?.toString() || "N/A"}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-800 font-medium">
                                Page <span className="font-bold">{currentPage}</span> of{" "}
                                <span className="font-bold">{totalPages}</span>
                            </span>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                                >
                                    <FiChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                                >
                                    <FiChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <PageLayout
            title="Quản lý Dữ liệu Khách hàng"
            subtitle="Xuất dữ liệu lên Google Sheets và quản lý dữ liệu trong hệ thống"
            icon={BarChart3}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            {renderTabContent()}
            
            {/* Modal */}
            {showModal && (
                <CustomerConfigForm
                    requiredFields={requiredFields}
                    setRequiredFields={setRequiredFields}
                    optionalFields={optionalFields}
                    setOptionalFields={setOptionalFields}
                    onClose={closeModal}
                    onSave={updateConfig}
                    loading={updateConfigLoading}
                />
            )}
        </PageLayout>
    );
};

export default ExportData;