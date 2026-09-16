import {Button, Flex, Form, Typography} from 'antd';

const {Text} = Typography;

const AuthFooterLink = ({prompt, actionLabel, onClick}) => (
    <Form.Item style={{marginBottom: 0, marginTop: 12}}>
        <Flex justify="center" align="center" gap={0} wrap="wrap">
            <Text type="secondary">{prompt}</Text>
            <Button type="link" style={{paddingInline: 4}} onClick={onClick}>
                {actionLabel}
            </Button>
        </Flex>
    </Form.Item>
);

export default AuthFooterLink;
