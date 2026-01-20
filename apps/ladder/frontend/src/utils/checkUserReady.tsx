import notification from '@/components/notification';
import confirmation from '@/utils/confirmation';
import FormBirthday from '@/components/FormBirthday';
import { setCurrentUser } from '@/reducers/auth';
import formatPhone from '@/utils/formatPhone';
import VerifyPhone from '@/components/VerifyPhone';

const checkForBirthday = async () => {
    const currentUser = window.tl.store.getState().auth.user;

    if (!currentUser || currentUser.birthday) {
        return true;
    }

    notification({
        inModal: true,
        title: 'Confirm Your Birth Date',
        render: ({ hide }) => (
            <div className="text-start">
                <p>
                    Please enter your birth date to continue using Rival. This helps us confirm you&apos;re{' '}
                    <b>at least 18 years of age</b>. We will never share this information.
                </p>

                <FormBirthday
                    onSubmit={() => {
                        hide();
                        notification({
                            inModal: true,
                            message: <div>You&apos;ve successfully set your birth date.</div>,
                            buttonTitle: 'Ok',
                        });
                    }}
                    onCancel={hide}
                />
            </div>
        ),
    });
};

const checkPhoneVerified = async () => {
    const currentUser = window.tl.store.getState().auth.user;

    if (!currentUser || currentUser.isPhoneVerified) {
        return true;
    }
    if (currentUser.totalMatches < 2 && currentUser.firstName.length > 2 && currentUser.lastName.length > 2) {
        return true;
    }

    const confirm = await confirmation({
        title: 'Verify Phone Number',
        message: (
            <div>
                <p>
                    Before you can continue using Rival, you need to verify your phone number:{' '}
                    <b>{formatPhone(currentUser.phone)}</b>.
                </p>
                <p>We will send you a confirmation code to enter on the next screen.</p>
                <p className="mb-0">
                    Not your current number? <a href="/user/settings">Change your number.</a>
                </p>
            </div>
        ),
        confirmButtonTitle: 'Verify phone',
    });
    if (!confirm) {
        return;
    }

    notification({
        inModal: true,
        title: 'Verify Phone Number',
        render: ({ hide }) => (
            <VerifyPhone
                phone={currentUser.phone}
                onSuccess={async () => {
                    hide();
                    notification({
                        inModal: true,
                        message: <div>You&apos;ve successfully verified your phone!</div>,
                        buttonTitle: 'Ok',
                    });
                    await window.tl.store.dispatch(setCurrentUser({ user: { isPhoneVerified: true } }));
                }}
            />
        ),
    });
};

// function, which will check if user has all necessary data,
// and if not, it will ask user to provide it
export default (func) => {
    return async () => {
        if (!(await checkForBirthday())) {
            return;
        }

        if (!(await checkPhoneVerified())) {
            return;
        }

        func();
    };
};
