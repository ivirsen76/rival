import { useMemo } from 'react';
import Loader from '@rival/common/components/Loader';
import useSettings from '@rival/common/utils/useSettings';
import { Route, Switch, type RouteComponentProps } from 'react-router-dom';
import Error from '@rival/common/components/Error';
import Card from '@rival/common/components/Card';
import NotFound from '../NotFound';
import Register from '../Register';
import { AssociationContext } from '@/contexts/AssociationContext';

type AssociationProps = RouteComponentProps<{ associationSlug: string }>;

const Association = (props: AssociationProps) => {
    const { associationSlug } = props.match.params;
    const { url } = props.match;
    const { settings, isSettingsLoading } = useSettings();

    const association = useMemo(() => {
        if (!settings) {
            return null;
        }

        return settings.associations.find((item) => item.slug === associationSlug);
    }, [settings, associationSlug]);

    if (isSettingsLoading) {
        return <Loader loading />;
    }

    if (!association) {
        return <Error message="The association is not found" />;
    }

    return (
        <AssociationContext.Provider value={association}>
            <Card>
                <div>Association</div>
                <Switch>
                    <Route exact path={`${url}/register`} component={Register} />
                    <Route component={NotFound} />
                </Switch>
            </Card>
        </AssociationContext.Provider>
    );
};

export default Association;
