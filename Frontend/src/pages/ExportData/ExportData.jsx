import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Loader2, AlertCircle, CheckCircle, BarChart3, Download, ExternalLink, Edit3, TestTube } from 'lucide-react';
import Sidebar from '../../components/layout/Sildebar';
import { export_sheet, get_mapping, update_mapping } from '../../services/exportService';
import { getFieldConfig, updateFieldConfig } from '../../services/fieldConfigService';
import CustomerConfigForm from '../../components/exportData/CustomerConfigForm';
import TableMapping from '../../components/exportData/TableMapping';
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
    }, [refresh]);

    return (
        <div className="flex-1 p-4 lg:p-8 bg-gray-50 min-h-screen overflow-auto">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Ánh xạ với Google Sheets
                            </h1>
                            <p className="text-gray-600">
                                Ánh xạ thủ công các trường thông tin với cột Google Sheets
                            </p>
                        </div>
                    </div>

                    {/* Message Display */}
                    {message.content && (
                        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 border ${message.type === 'success'
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
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
                    <div className="flex flex-wrap gap-3 mb-4">
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
                </div>

                {/* Export Result */}
                {exportResult && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
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
                <TableMapping mappings={mappings}             // state chứa mapping hiện tại
                    setMappings={setMappings}       // hàm cập nhật mapping
                    loading={loading}
                    customerFields={customerFields} />

                {/* Action Buttons */}
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
            {
                showModal && (
                    <CustomerConfigForm
                        requiredFields={requiredFields}
                        setRequiredFields={setRequiredFields}
                        optionalFields={optionalFields}
                        setOptionalFields={setOptionalFields}
                        onClose={closeModal}
                        onSave={updateConfig}
                        loading={updateConfigLoading}
                    />
                )
            }
        </div>


    );
};

export default ExportData;