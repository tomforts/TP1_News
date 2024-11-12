let defaultRequireMessage = "Obligatoire";
let defaultInvalidMessage = "Format invalide";
let defaultCustomErrorMessage = "Champ invalide";

function initFormValidation() {
    $(".Id").each(function () {
        $(this).attr("pattern", String.raw`^[a-zA-Z0-9\-]+$`);
    });
    $(".Title").each(function () {
        $(this).attr("pattern", String.raw`^[a-zA-Z0-9\s\-]+$`);
    });
    $(".Text").each(function () {
        $(this).attr("pattern", String.raw`^[a-zA-Z0-9\s\-.,!?]+$`);
    });
    $(".Category").each(function () {
        $(this).attr("pattern", String.raw`^[a-zA-Z0-9\s\-]+$`);
    });
    $(".Image").each(function () {
        $(this).attr("pattern", String.raw`^https?:\/\/[^\s]+$`);
    });
    $(".Creation").each(function () {
        $(this).attr("pattern", String.raw`^\d{4}-\d{2}-\d{2}$`);
        $(this).mask("9999-99-99", { autoclear: false });
    });
    $(".datepicker").datepicker({
        dateFormat: "yy-mm-dd",
        monthNames: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
        monthNamesShort: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
        dayNamesMin: ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"],
        dayNamesShort: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
    });
    $("input[type='radio']").each(function () {
        $(this).attr(
            "onchange",
            "this.setCustomValidity(''); document.getElementsByName('" +
            $(this).attr("name") +
            "').forEach((radio) => {radio.setCustomValidity('')});"
        );
    });

    $("input[type='password']").each(function () {
        $(this).attr("pattern", String.raw`^\S{6,}$`);
    });

    $("input, select").each(function () {
        let RequireMessage = $(this).attr('RequireMessage') != null ? $(this).attr('RequireMessage') : defaultRequireMessage;
        let InvalidMessage = $(this).attr('InvalidMessage') != null ? $(this).attr('InvalidMessage') : defaultInvalidMessage;
        let CustomErrorMessage = $(this).attr('CustomErrorMessage') != null ? $(this).attr('CustomErrorMessage') : defaultCustomErrorMessage;
        $(this).on("input", function (event) {
            event.target.setCustomValidity('');
            event.target.checkValidity();
        });
        $(this).on("change", function (event) {
            event.target.setCustomValidity('');
            event.target.checkValidity();
        });
        $(this).on("keypress", function (event) {
            event.target.setCustomValidity('');
            event.target.checkValidity();
        });
        $(this).on("focus", function (event) {
            event.target.setCustomValidity('');
            event.target.checkValidity();
        });
        $(this).on("invalid", function (event) {
            let validity = event.target.validity;
            if (validity.valueMissing)
                event.target.setCustomValidity(RequireMessage);
            else if (validity.customError)
                event.target.setCustomValidity(CustomErrorMessage);
            else
                event.target.setCustomValidity(InvalidMessage);
        });
    });

    $(".MatchedInput").each(function () {
        let input = $(this);
        let matchedInput = $(`#${input.attr('matchedInputId')}`);
        matchedInput.on("change", function () { input.attr("pattern", matchedInput.val()); });
        matchedInput.on("focus", function () { input.attr("pattern", matchedInput.val()); });
        input.on("focus", function () { input.attr("pattern", matchedInput.val()); });
    });
}