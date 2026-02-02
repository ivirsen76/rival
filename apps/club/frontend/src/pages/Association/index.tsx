import { useMemo } from 'react';
import Loader from '@rival/common/components/Loader';
import useSettings from '@rival/common/utils/useSettings';
import type { RouteComponentProps } from 'react-router-dom';
import Error from '@rival/common/components/Error';

type AssociationProps = RouteComponentProps<{ associationSlug: string }>;

const Association = (props: AssociationProps) => {
    const { associationSlug } = props.match.params;
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

    console.log(association);

    return (
        <div>
            <div>Association</div>
        </div>
    );
};

export default Association;
