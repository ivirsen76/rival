import PropTypes from 'prop-types';
import FieldWrapper from '../FieldWrapper';
import classnames from 'classnames';
import { useQuery } from 'react-query';
import axios from '@/utils/axios';
import useConfig from '@/utils/useConfig';
import style from './style.module.scss';

export const getValidateTeamName = (config) => (value) => {
    const teamName = value.trim();
    let error;

    if (!teamName) {
        error = 'Team name is required.';
    } else if (teamName.length < config.teamNameMinLength || teamName.length > config.teamNameMaxLength) {
        error = `From ${config.teamNameMinLength} to ${config.teamNameMaxLength} characters.`;
    } else if (!/^[a-zA-Z0-9& -]+$/.test(teamName)) {
        error = 'Only letters, digits, ampersand, dashes, and spaces are allowed.';
    }

    return error;
};

const TeamNamePicker = (props) => {
    const { field, form, tournamentId, wrapperClassName } = props;
    const showError = form.errors[field.name] && form.submitCount > 0;
    const config = useConfig();

    const { data: suggestedTeamNames, isLoading } = useQuery({
        queryKey: ['doublesTeamName', tournamentId],
        queryFn: async () => {
            const response = await axios.put(`/api/players`, {
                action: 'getSuggestedTeamNames',
                tournamentId,
            });

            return response.data;
        },
        staleTime: 0,
        keepPreviousData: true,
    });

    return (
        <div className={typeof wrapperClassName === 'string' ? wrapperClassName : 'mb-6'}>
            <FieldWrapper {...props} wrapperClassName="">
                <input
                    className={classnames('form-control', 'form-control-solid', { 'is-invalid': showError })}
                    autoComplete="off"
                    type="text"
                    {...props.field}
                    maxLength={config.teamNameMaxLength}
                    value={props.field.value || ''}
                />
            </FieldWrapper>
            {isLoading ? (
                <div className="spinner-border spinner-border-sm text-secondary mt-3" />
            ) : (
                <div className={classnames(style.suggestedNames, 'mt-3')}>
                    {suggestedTeamNames.map((name) => (
                        <div
                            key={name}
                            type="button"
                            className="badge badge-light badge-sm"
                            onClick={() => {
                                form.setFieldValue(field.name, name);
                            }}
                        >
                            {name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

TeamNamePicker.propTypes = {
    form: PropTypes.object,
    field: PropTypes.object,
    label: PropTypes.node,
    tournamentId: PropTypes.number.isRequired,
    wrapperClassName: PropTypes.string,
};

TeamNamePicker.defaultProps = {
    label: 'Come up with your team name or pick from the list below:',
};

export default TeamNamePicker;
