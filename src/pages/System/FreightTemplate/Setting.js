import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import {
    Row, Col, List, Card, Input, Button, Modal, Form, notification, Table, Popconfirm, Divider, Select, Tag, Icon,
    Menu, Dropdown, Checkbox, Switch, Badge, Tooltip, InputNumber, TreeSelect
} from 'antd';

import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import StandardTable from '@/components/StandardTable';
import router from 'umi/router';
import Link from 'umi/link';
import { formatBool } from '@/utils/utils';

const FormItem = Form.Item;
const Option = Select.Option;
const level = ['省', '市', '区', '街道'];

@connect()
@Form.create()
class FreightTemplateSettingList extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            visible: false,
            data: [],
            current: {},
            submitting: false,

            search: {},
            pageNum: 1,
            pageSize: 10,
            predicate: 'id',
            reverse: true,
            pageData: {
                list: [],
                pagination: {}
            },

            id: props.location.query.id,

            countries: [],
            countriesLoading: false,

            provinces: [],
            provincesLoading: false,
        };
    }

    columns = [
        {
            title: '操作',
            align: 'center',
            key: 'operation',
            fixed: 'left',
            width: 120,
            render: (text, record) => (
                <Fragment>
                    <Button.Group>
                        <Button icon="edit" size="small" onClick={() => this.showEditModal(record)}></Button>
                        <Popconfirm title="确定要删除吗？" onConfirm={() => this.deleteItem(record.id)}>
                            <Button icon="delete" type="danger" size="small"></Button>
                        </Popconfirm>
                    </Button.Group>
                </Fragment>
            )
        },
        {
            title: 'ID',
            dataIndex: 'id',
            width: 100,
            sorter: true,
            defaultSortOrder: 'descend',
        },
        {
            title: '国家',
            dataIndex: 'countryName',
            width: 120,
        },
        {
            title: '省市区',
            dataIndex: 'stateOrProvinceName',
            width: 150,
            render: (text, record) => {
                if (record.stateOrProvinceLevel != null) {
                    return <div>
                        <Tag>{level[record.stateOrProvinceLevel]}</Tag>
                        {text}
                    </div>;
                }
                return text;
            }
        },
        {
            title: '最低订单金额',
            dataIndex: 'minOrderSubtotal',
            width: 150,
            sorter: true,
        },
        {
            title: '运费',
            dataIndex: 'shippingPrice',
            width: 120,
            sorter: true,
        },
        {
            title: '启用',
            dataIndex: 'isEnabled',
            width: 100,
            sorter: true,
            render: (val) => formatBool(val)
        },
        {
            title: '备注',
            dataIndex: 'note',
            sorter: true,
        },
    ];

    componentDidMount() {
        this.handleInit();
        this.handleSearchFirst();
    }

    handleInit = () => {
        const { dispatch } = this.props;
        this.setState({ countriesLoading: true });
        new Promise(resolve => {
            dispatch({
                type: 'system/countries',
                payload: {
                    resolve
                },
            });
        }).then(res => {
            this.setState({ countriesLoading: false });
            if (res.success === true) {
                this.setState({ countries: res.data });
            } else {
                notification.error({ message: res.message, });
            }
        });
    }

    handleInitProvinces = (countryId) => {
        const { dispatch } = this.props;
        this.setState({ provincesLoading: true });
        new Promise(resolve => {
            dispatch({
                type: 'system/provinces',
                payload: {
                    resolve,
                    params: { countryId: countryId },
                },
            });
        }).then(res => {
            this.setState({ provincesLoading: false });
            if (res.success === true) {
                this.setState({ provinces: res.data });
            } else {
                notification.error({ message: res.message, });
            }
        });
    }


    showModal = () => {
        this.setState({
            visible: true,
            current: {}
        });
    };

    showEditModal = item => {
        this.setState({
            visible: true,
            current: item,
        }, () => {
            this.handleInitProvinces(item.countryId);
        });
    };

    handleCancel = () => {
        this.setState({
            visible: false
        });
    };

    handleSubmit = e => {
        e.preventDefault();
        const { dispatch, form } = this.props;
        const id = this.state.current ? this.state.current.id : '';

        form.validateFields((err, values) => {
            if (err) return;

            var params = {
                ...values,
                freightTemplateId: this.state.id
            };

            let bt = 'price-destination/add';
            if (id) {
                params.id = id;
                bt = 'price-destination/edit';
            }

            // console.log(params);

            if (this.state.submitting === true)
                return;
            this.setState({ submitting: true });
            new Promise(resolve => {
                dispatch({
                    type: bt,
                    payload: {
                        resolve,
                        params
                    },
                });
            }).then(res => {
                this.setState({ submitting: false });
                if (res.success === true) {
                    form.resetFields();
                    this.setState({ visible: false });
                    this.handleInit();
                    this.handleSearch();
                } else {
                    notification.error({
                        message: res.message,
                    });
                }
            });
        });
    };

    deleteItem = id => {
        this.setState({ loading: true, });
        const { dispatch } = this.props;
        new Promise(resolve => {
            dispatch({
                type: 'price-destination/delete',
                payload: {
                    resolve,
                    params: { id },
                },
            });
        }).then(res => {
            this.setState({ loading: false });
            if (res.success === true) {
                this.handleSearch();
            } else {
                notification.error({
                    message: res.message,
                });
            }
        });
    };

    handleSearch = () => {
        this.setState({
            loading: true,
        });
        const { dispatch } = this.props;
        const params =
        {
            pagination: {
                current: this.state.pageNum,
                pageSize: this.state.pageSize
            },
            sort: {
                predicate: this.state.predicate,
                reverse: this.state.reverse
            },
            search: { ...this.state.search, name: this.state.name },
            freightTemplateId: this.state.id
        };

        new Promise(resolve => {
            dispatch({
                type: 'price-destination/grid',
                payload: {
                    resolve,
                    params,
                },
            });
        }).then(res => {
            this.setState({ loading: false });
            if (res.success === true) {
                this.setState({ pageData: res.data });
            } else {
                notification.error({ message: res.message });
            }
        });
    };

    handleSearchFirst = () => {
        this.setState({
            pageNum: 1
        }, () => {
            this.handleSearch();
        });
    }

    handleStandardTableChange = (pagination, filtersArg, sorter) => {
        var firstPage = sorter.field != this.state.predicate;
        this.setState({
            pageNum: pagination.current,
            pageSize: pagination.pageSize,
            search: {
                ...filtersArg
            }
        }, () => {
            if (sorter.field) {
                this.setState({
                    predicate: sorter.field,
                    reverse: sorter.order == 'descend'
                }, () => {
                    if (firstPage)
                        this.handleSearchFirst();
                    else
                        this.handleSearch();
                });
            } else {
                if (firstPage)
                    this.handleSearchFirst();
                else
                    this.handleSearch();
            }
        });
    };

    render() {
        const { form: { getFieldDecorator }, } = this.props;
        const modalFooter = { okText: '保存', onOk: this.handleSubmit, onCancel: this.handleCancel };
        const formLayout = {
            labelCol: { span: 7 },
            wrapperCol: { span: 13 },
        };
        const pagination = {
            showQuickJumper: true,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '50', '100'],
            defaultPageSize: this.state.pageSize,
            defaultCurrent: this.state.pageNum,
            current: this.state.pageNum,
            pageSize: this.state.pageSize,
            total: this.state.pageData.pagination.total || 0,
            showTotal: (total, range) => {
                return `${range[0]}-${range[1]} 条 , 共 ${total} 条`;
            }
        };
        const getModalContent = () => {
            return (
                <Form onSubmit={this.handleSubmit}>
                    <FormItem label="国家" {...formLayout}>
                        {getFieldDecorator('countryId', {
                            rules: [{ required: true, message: '请选择国家' }],
                            initialValue: this.state.current.countryId, valuePropName: 'value'
                        })(
                            <Select
                                placeholder="请选择国家"
                                loading={this.state.countriesLoading}
                                allowClear={true}
                                onChange={(value) => {
                                    this.props.form.setFieldsValue({ stateOrProvinceId: '' })
                                    if (value) {
                                        this.handleInitProvinces(value);
                                    } else {
                                        this.setState({ provinces: [] });
                                    }
                                }}>
                                {this.state.countries.map(c => {
                                    return <Option key={c.id} value={c.id}>{c.name}</Option>;
                                })}
                            </Select>)}
                    </FormItem>
                    <FormItem label={<span>省市区</span>} {...formLayout}>
                        {getFieldDecorator('stateOrProvinceId', {
                            initialValue: this.state.current.stateOrProvinceId || '', valuePropName: 'value'
                        })(
                            <TreeSelect
                                // treeDefaultExpandAll
                                loading={this.state.provincesLoading}
                                allowClear={true}
                                treeData={this.state.provinces}
                            />)}
                    </FormItem>
                    <FormItem label="最低订单金额" {...formLayout}>
                        {getFieldDecorator('minOrderSubtotal', {
                            initialValue: this.state.current.minOrderSubtotal || 0,
                        })(<InputNumber min={0} style={{ width: '100%' }} />)}
                    </FormItem>
                    <FormItem label="运费" {...formLayout}>
                        {getFieldDecorator('shippingPrice', {
                            initialValue: this.state.current.shippingPrice || 0,
                        })(<InputNumber min={0} style={{ width: '100%' }} />)}
                    </FormItem>
                    <FormItem
                        label={<span>备注</span>}
                        {...formLayout}>
                        {getFieldDecorator('note', { initialValue: this.state.current.note })(
                            <Input.TextArea rows={2} />
                        )}
                    </FormItem>
                    <FormItem label="启用" {...formLayout}>
                        {getFieldDecorator('isEnabled', {
                            initialValue: this.state.current.isEnabled || false, valuePropName: 'checked'
                        })(<Checkbox />)}
                    </FormItem>
                </Form>
            );
        };
        const rollback = (
            <Fragment>
                <Button
                    onClick={this.showModal}
                    type="primary"
                    icon="plus">添加</Button>
                <Link to="./list">
                    <Button>
                        <Icon type="rollback" />
                    </Button>
                </Link>
            </Fragment>
        );
        return (
            <PageHeaderWrapper title="运费配置" action={rollback}>
                <div>
                    <Card bordered={false}>
                        <StandardTable
                            pagination={pagination}
                            loading={this.state.loading}
                            data={this.state.pageData}
                            rowKey={record => record.id}
                            columns={this.columns}
                            bordered
                            onChange={this.handleStandardTableChange}
                            scroll={{ x: 960 }}
                        />
                    </Card>
                </div>
                <Modal
                    title={`运费配置 - ${this.state.current.id ? '编辑' : '添加'}`}
                    destroyOnClose
                    visible={this.state.visible}
                    {...modalFooter}>
                    {getModalContent()}
                </Modal>
            </PageHeaderWrapper>
        );
    }
}

export default FreightTemplateSettingList;
