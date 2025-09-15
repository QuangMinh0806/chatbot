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
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Sidebar />
            <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen overflow-auto">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center lg:text-left">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <BarChart3 className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                        Ánh xạ với Google Sheets
                                    </h1>
                                    <p className="text-gray-600 text-lg">
                                        Ánh xạ thủ công các trường thông tin với cột Google Sheets
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Message Display */}
                        {message.content && (
                            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 shadow-lg ${message.type === 'success'
                                ? 'bg-green-50 border-2 border-green-200 text-green-800'
                                : 'bg-red-50 border-2 border-red-200 text-red-800'
                                }`}>
                                {message.type === 'success'
                                    ? <CheckCircle className="w-6 h-6 flex-shrink-0" />
                                    : <AlertCircle className="w-6 h-6 flex-shrink-0" />
                                }
                                <span className="font-medium">{message.content}</span>
                            </div>
                        )}

                        {/* Warning */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-6 shadow-lg">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xl">⚠</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-900 mb-2">Lưu ý quan trọng</h3>
                                    <p className="text-blue-800 leading-relaxed">
                                        Bạn cần ánh xạ thủ công các trường thông tin với cột Google Sheets để đảm bảo dữ liệu được xuất chính xác.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4 mb-8">
                            <button
                                onClick={loadMapping}
                                disabled={loading}
                                className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                Tải columns từ Lead Sheet
                            </button>

                            <button
                                onClick={exportToGoogleSheets}
                                disabled={exportLoading}
                                className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-4 rounded-2xl hover:from-green-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                {exportLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                Export dữ liệu
                            </button>

                            <button
                                onClick={handleOpenModal}
                                disabled={updateConfigLoading}
                                className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-700 text-white px-6 py-4 rounded-2xl hover:from-purple-700 hover:to-pink-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                {updateConfigLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit3 className="w-5 h-5" />}
                                Cập nhật cấu hình
                            </button>
                        </div>

                        {/* Export Result */}
                        {exportResult && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6 shadow-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-green-800 mb-1">Export thành công!</h3>
                                        <p className="text-green-700">
                                            Đã export <span className="font-bold">{exportResult.count}</span> bản ghi sang Google Sheets
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
                    </div>

                    {/* Google Sheets Link */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Link Google Sheets</h3>
                                <p className="text-gray-600">Truy cập trực tiếp đến Google Sheets</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={exportResult?.url || "https://docs.google.com/spreadsheets/d/1eci4KfF4VNQop9j63mnaKys1N3g3gJ3bdWpsgEE4wJs/edit?usp=sharing"}
                                readOnly
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-700 focus:outline-none font-mono text-sm"
                            />
                            <button
                                onClick={() => openInNewTab(exportResult?.url || "https://docs.google.com/spreadsheets/d/1eci4KfF4VNQop9j63mnaKys1N3g3gJ3bdWpsgEE4wJs/edit?usp=sharing")}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all font-semibold shadow-lg hover:shadow-xl"
                                title="Mở trong tab mới"
                            >
                                <ExternalLink className="w-5 h-5" />
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
                    <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                        <button
                            onClick={saveMapping}
                            disabled={loading}
                            className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Lưu cấu hình
                        </button>

                        <button
                            onClick={loadMapping}
                            disabled={loading}
                            className="flex items-center gap-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-4 rounded-2xl hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TestTube className="w-5 h-5" />}
                            Kiểm tra kết nối
                        </button>
                    </div>
                </div>
            </div>

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

        </div>
    );
};

export default ExportData;